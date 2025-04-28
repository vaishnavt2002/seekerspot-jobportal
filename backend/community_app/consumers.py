import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Community, CommunityMessage, CommunityMember
from django.contrib.auth import get_user_model

User = get_user_model()

class CommunityChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.community_name = self.scope['url_route']['kwargs']['community_name']
        print(f"WebSocket attempting to connect: community_name={self.community_name}")
        self.community_group_name = f'community_{self.community_name}'
        
        # Debug scope and user
        print("Scope:", self.scope)
        print("User from scope:", self.scope.get('user'))
        
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            print(f"WebSocket connection rejected: User not authenticated")
            await self.close(code=4001, reason="User not authenticated")
            return
        
        print(f"WebSocket authenticating user: {user.username}, user_id={user.id}")
        
        # Verify user is a member or admin
        try:
            is_member = await self.is_member_or_admin()
            if is_member:
                await self.channel_layer.group_add(
                    self.community_group_name,
                    self.channel_name
                )
                await self.accept()
                print(f"WebSocket connection accepted for community: {self.community_name}")
                
                # Send connection confirmation message
                await self.send(text_data=json.dumps({
                    'type': 'connection_established',
                    'message': f'Connected to community chat {self.community_name}',
                    'user': user.username
                }))
            else:
                print(f"WebSocket connection rejected: User not authorized for community {self.community_name}")
                await self.close(code=4003, reason="User not authorized")
                return
        except Exception as e:
            print(f"WebSocket connection error: {str(e)}")
            await self.close(code=4000, reason=f"Connection error: {str(e)}")
            return

    async def disconnect(self, close_code):
        if hasattr(self, 'community_group_name'):
            await self.channel_layer.group_discard(
                self.community_group_name,
                self.channel_name
            )
        print(f"WebSocket disconnected: close_code={close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get('message', '')
            attachment = data.get('attachment')  # URL or file metadata
            
            # Save message to database if there's content or an attachment
            if message.strip() or attachment:
                saved_message = await self.save_message(message, attachment)
                
                # Broadcast to group
                await self.channel_layer.group_send(
                    self.community_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'attachment': attachment,
                        'sender': self.scope['user'].username,
                        'sender_id': self.scope['user'].id,
                        'timestamp': saved_message.created_at.isoformat(),
                        'id': saved_message.id
                    }
                )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid message format'
            }))
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            await self.send(text_data=json.dumps({
                'error': f'Error processing message: {str(e)}'
            }))

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'content': event['message'],
            'attachment': event['attachment'],
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp'],
            'id': event.get('id')
        }))

    @database_sync_to_async
    def is_member_or_admin(self):
        user = self.scope['user']
        if not user.is_authenticated:
            return False
        
        print(f"Checking membership for user: {user.username}, type: {user.user_type}")
        
        if user.user_type == 'admin':
            return True
            
        try:
            # Improved logic to handle both numeric and string IDs
            community = None
            
            # First try to get by ID (if it's a number)
            if self.community_name.isdigit():
                try:
                    community = Community.objects.get(id=int(self.community_name))
                except Community.DoesNotExist:
                    pass
            
            # If not found by ID, try to get by name
            if community is None:
                try:
                    community = Community.objects.get(name=self.community_name)
                except Community.DoesNotExist:
                    raise Community.DoesNotExist(f"Community not found with ID or name: {self.community_name}")
            
            is_member = CommunityMember.objects.filter(
                community=community,
                user=user
            ).exists()
            
            print(f"User {user.username} membership check for community {self.community_name}: {is_member}")
            return is_member
            
        except Community.DoesNotExist as e:
            print(f"Community not found: {self.community_name} - {str(e)}")
            return False
        except Exception as e:
            print(f"Error checking membership: {str(e)}")
            return False

    @database_sync_to_async
    def save_message(self, message, attachment):
        try:
            # Improved logic to handle both numeric and string IDs
            community = None
            
            # First try to get by ID (if it's a number)
            if self.community_name.isdigit():
                try:
                    community = Community.objects.get(id=int(self.community_name))
                except Community.DoesNotExist:
                    pass
            
            # If not found by ID, try to get by name
            if community is None:
                try:
                    community = Community.objects.get(name=self.community_name)
                except Community.DoesNotExist:
                    raise Community.DoesNotExist(f"Community not found with ID or name: {self.community_name}")
            
            return CommunityMessage.objects.create(
                community=community,
                sender=self.scope['user'],
                content=message,
                attachment=attachment
            )
        except Community.DoesNotExist:
            raise ValueError(f"Community not found: {self.community_name}")
        except Exception as e:
            raise ValueError(f"Error saving message: {str(e)}")