import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Community, CommunityMessage, CommunityMember, UserReadStatus
from django.contrib.auth import get_user_model
import logging
from .utils import get_attachment_type
from django.db import transaction

logger = logging.getLogger(__name__)

User = get_user_model()

class CommunityChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        logger.info("WebSocket attempting to connect: user=%s", self.user)
        
        if not self.user or not self.user.is_authenticated:
            logger.warning("WebSocket connection rejected: User not authenticated")
            await self.close(code=4001, reason="User not authenticated")
            return
        
        logger.info("WebSocket authenticating user: %s, user_id=%s", self.user.username, self.user.id)
        
        try:
            communities = await self.get_user_communities()
            self.community_groups = {}
            for community in communities:
                group_name = f'community_{community.id}'
                self.community_groups[community.id] = group_name
                await self.channel_layer.group_add(group_name, self.channel_name)
                logger.debug("Joined group: %s", group_name)
            
            await self.accept()
            logger.info("WebSocket connection accepted for user: %s", self.user.username)
            
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to community chat service',
                'user': self.user.username
            }))
        except Exception as e:
            logger.error("WebSocket connection error: %s", str(e))
            await self.close(code=4000, reason=f"Connection error: {str(e)}")
            return

    async def disconnect(self, close_code):
        if hasattr(self, 'community_groups'):
            for group_name in self.community_groups.values():
                try:
                    await self.channel_layer.group_discard(group_name, self.channel_name)
                    logger.debug("Discarded group: %s", group_name)
                except Exception as e:
                    logger.error("Error discarding group %s: %s", group_name, str(e))
        logger.info("WebSocket disconnected: close_code=%s", close_code)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')
        
            if message_type == 'mark_read':
                await self.handle_mark_read(data)
                return
            elif message_type == 'fetch_unread_counts':
                await self.handle_fetch_unread_counts()
                return
            community_id = data.get('community_id')
            message = data.get('message', '')
            attachment = data.get('attachment')
            
            
            if not community_id:
                logger.warning("Received message without community_id")
                await self.send(text_data=json.dumps({
                    'error': 'community_id is required'
                }))
                return
                
            is_authorized = await self.is_member_or_admin(community_id)
            if not is_authorized:
                logger.warning("User %s not authorized for community %s", self.user.username, community_id)
                await self.send(text_data=json.dumps({
                    'error': 'You are not authorized to send messages to this community'
                }))
                return
                
            if message.strip() or attachment:
                saved_message = await self.save_message(community_id, message, attachment)
                
                attachment_url = None
                if saved_message.attachment:
                    attachment_url = saved_message.attachment.url
                
                await self.channel_layer.group_send(
                    f'community_{community_id}',
                    {
                        'type': 'chat_message',
                        'community_id': community_id,
                        'message': message,
                        'attachment': attachment_url,
                        'attachment_type': get_attachment_type(saved_message.attachment) if saved_message.attachment else None,
                        'sender': self.user.username,
                        'sender_id': self.user.id,
                        'timestamp': saved_message.created_at.isoformat(),
                        'id': saved_message.id
                    }
                )
                logger.debug("Message sent to group: community_%s", community_id)
        except json.JSONDecodeError:
            logger.error("Invalid message format received")
            await self.send(text_data=json.dumps({
                'error': 'Invalid message format'
            }))
        except Exception as e:
            logger.error("Error processing message: %s", str(e))
            await self.send(text_data=json.dumps({
                'error': f'Error processing message: {str(e)}'
            }))

    async def chat_message(self, event):
        try:
            await self.send(text_data=json.dumps({
                'community_id': event['community_id'],
                'content': event['message'],
                'attachment': event['attachment'],
                'attachment_type': event.get('attachment_type'),
                'sender': event['sender'],
                'sender_id': event['sender_id'],
                'timestamp': event['timestamp'],
                'id': event.get('id')
            }))
            logger.debug("Chat message sent to client: %s", event['sender'])
        except Exception as e:
            logger.error("Error sending chat message to client: %s", str(e))

    @database_sync_to_async
    def get_user_communities(self):
        try:
            if self.user.user_type == 'admin':
                return list(Community.objects.all())
            return list(Community.objects.filter(members__user=self.user))
        except Exception as e:
            logger.error("Error fetching user communities: %s", str(e))
            raise

    @database_sync_to_async
    def is_member_or_admin(self, community_id):
        if not self.user.is_authenticated:
            return False
        
        logger.debug("Checking membership for user: %s, community_id: %s", self.user.username, community_id)
        
        if self.user.user_type == 'admin':
            return True
            
        try:
            community = Community.objects.get(id=community_id)
            is_member = CommunityMember.objects.filter(
                community=community,
                user=self.user
            ).exists()
            
            logger.debug("User %s membership check for community %s: %s", self.user.username, community_id, is_member)
            return is_member
        except Community.DoesNotExist:
            logger.warning("Community not found: %s", community_id)
            return False
        except Exception as e:
            logger.error("Error checking membership: %s", str(e))
            return False

    @database_sync_to_async
    def save_message(self, community_id, message, attachment):
        try:
            community = Community.objects.get(id=community_id)
            return CommunityMessage.objects.create(
                community=community,
                sender=self.user,
                content=message,
                attachment=attachment
            )
        except Community.DoesNotExist:
            raise ValueError(f"Community not found: {community_id}")
        except Exception as e:
            raise ValueError(f"Error saving message: {str(e)}")
        
    async def handle_mark_read(self, data):
        try:
            community_id = data.get('community_id')
            message_id = data.get('message_id')
            
            if not community_id:
                await self.send(text_data=json.dumps({
                    'error': 'community_id is required'
                }))
                return
                
            # Verify user is a member or admin
            is_authorized = await self.is_member_or_admin(community_id)
            if not is_authorized:
                await self.send(text_data=json.dumps({
                    'error': 'You are not authorized for this community'
                }))
                return
                
            # Update read status
            success = await self.update_read_status(community_id, message_id)
            
            if success:
                await self.send(text_data=json.dumps({
                    'type': 'read_status_updated',
                    'community_id': community_id,
                    'status': 'success'
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'read_status_updated',
                    'community_id': community_id,
                    'status': 'error'
                }))
                
        except Exception as e:
            logger.error("Error processing mark_read: %s", str(e))
            await self.send(text_data=json.dumps({
                'error': f'Error updating read status: {str(e)}'
            }))

    @database_sync_to_async
    def update_read_status(self, community_id, message_id=None):
        try:
            with transaction.atomic():
                community = Community.objects.get(id=community_id)
                
                if message_id:
                    try:
                        message_id = int(message_id)
                        message = CommunityMessage.objects.get(id=message_id, community=community)
                    except (ValueError, TypeError):
                        message = CommunityMessage.objects.filter(community=community).order_by('-created_at').first()
                else:
                    message = CommunityMessage.objects.filter(community=community).order_by('-created_at').first()
                    
                if message:
                    UserReadStatus.objects.update_or_create(
                        user=self.user,
                        community=community,
                        defaults={'last_read_message': message}
                    )
            return True
        except Exception as e:
            logger.error("Error updating read status: %s", str(e))
            return False
    async def handle_fetch_unread_counts(self):
        try:
            # Get unread counts for all communities the user is a member of
            unread_counts = await self.get_unread_counts()
            
            # Send unread counts to the client
            await self.send(text_data=json.dumps({
                'type': 'unread_counts_update',
                'unread_counts': unread_counts
            }))
        except Exception as e:
            logger.error("Error fetching unread counts: %s", str(e))
            await self.send(text_data=json.dumps({
                'error': f'Error fetching unread counts: {str(e)}'
            }))

    @database_sync_to_async
    def get_unread_counts(self):
        try:
            result = {}
            if self.user.user_type == 'admin':
                communities = Community.objects.all()
            else:
                communities = Community.objects.filter(members__user=self.user)
                
            for community in communities:
                read_status = UserReadStatus.objects.filter(
                    user=self.user,
                    community=community
                ).first()
                
                if read_status and read_status.last_read_message:
                    unread_count = CommunityMessage.objects.filter(
                        community=community,
                        created_at__gt=read_status.last_read_message.created_at
                    ).exclude(sender=self.user).count()  
                else:
                    unread_count = CommunityMessage.objects.filter(
                        community=community
                    ).exclude(sender=self.user).count()
                
                result[str(community.id)] = unread_count
                
            return result
        except Exception as e:
            logger.error("Error getting unread counts: %s", str(e))
            return {}