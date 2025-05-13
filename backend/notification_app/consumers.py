import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from auth_app.models import User
from .models import Notification
import logging

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        logger.info(f"WebSocket connect attempt from {self.scope.get('client')} - User authenticated: {not isinstance(self.user, AnonymousUser)}")
        
        if isinstance(self.user, AnonymousUser):
            logger.warning("Anonymous user attempted to connect to notification socket")
            await self.close(code=4001)
            return

        # Each user has their own notification group
        self.notification_group_name = f"notifications_{self.user.id}"
        
        # Join the group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        logger.info(f"User {self.user.id} connected to notification websocket")
        await self.accept()
        
        # Send unread notifications on connect
        unread_notifications = await self.get_unread_notifications()
        logger.info(f"Sending {len(unread_notifications)} unread notifications to user {self.user.id}")
        
        if unread_notifications:
            await self.send(text_data=json.dumps({
                'type': 'unread_notifications',
                'notifications': unread_notifications
            }))
        else:
            logger.info(f"No unread notifications for user {self.user.id}")
            # Send empty array to confirm connection is working
            await self.send(text_data=json.dumps({
                'type': 'unread_notifications',
                'notifications': []
            }))

    async def disconnect(self, close_code):
        # Leave the group
        logger.info(f"User {self.user.id if hasattr(self, 'user') and not isinstance(self.user, AnonymousUser) else 'Anonymous'} disconnected from notification websocket with code {close_code}")
        
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle messages from the client"""
        try:
            logger.info(f"Received message from user {self.user.id}: {text_data[:200]}")
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                notification_id = data.get('notification_id')
                all_notifications = data.get('all', False)
                
                if all_notifications:
                    logger.info(f"User {self.user.id} marking all notifications as read")
                    await self.mark_all_as_read()
                    await self.send(text_data=json.dumps({
                        'type': 'notifications_marked_read',
                        'all': True,
                        'success': True
                    }))
                elif notification_id:
                    logger.info(f"User {self.user.id} marking notification {notification_id} as read")
                    success = await self.mark_notification_as_read(notification_id)
                    await self.send(text_data=json.dumps({
                        'type': 'notification_marked_read',
                        'notification_id': notification_id,
                        'success': success
                    }))
                else:
                    logger.warning(f"Invalid mark_read request from user {self.user.id}: missing notification_id or all flag")
            else:
                logger.warning(f"Unknown message type received from user {self.user.id}: {message_type}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f"Unknown message type: {message_type}"
                }))
        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON from user {self.user.id}: {text_data[:200]}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "Invalid JSON format"
            }))
        except Exception as e:
            logger.exception(f"Error handling message from user {self.user.id}: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f"Server error: {str(e)}"
            }))

    async def notification_message(self, event):
        """Send notification to the WebSocket when received from channel layer"""
        logger.info(f"Sending notification to user {self.user.id}: {event.get('notification', {}).get('id')}")
        # Forward the event data directly to the WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_unread_notifications(self):
        """Retrieve unread notifications for the current user"""
        try:
            notifications = Notification.objects.filter(
                user=self.user,
                is_read=False
            ).order_by('-created_at')[:20]
            
            return [
                {
                    'id': str(notification.id),
                    'title': notification.title,
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'created_at': notification.created_at.isoformat(),
                    'source_id': notification.source_id,
                    'source_type': notification.source_type,
                    'is_read': notification.is_read
                }
                for notification in notifications
            ]
        except Exception as e:
            logger.exception(f"Error retrieving unread notifications for user {self.user.id}: {str(e)}")
            return []

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark a specific notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.is_read = True
            notification.save()
            logger.info(f"Notification {notification_id} marked as read for user {self.user.id}")
            return True
        except Notification.DoesNotExist:
            logger.warning(f"Attempt to mark non-existent notification {notification_id} as read by user {self.user.id}")
            return False
        except Exception as e:
            logger.exception(f"Error marking notification {notification_id} as read: {str(e)}")
            return False

    @database_sync_to_async
    def mark_all_as_read(self):
        """Mark all notifications for the user as read"""
        try:
            count = Notification.objects.filter(user=self.user, is_read=False).count()
            Notification.objects.filter(user=self.user, is_read=False).update(is_read=True)
            logger.info(f"Marked {count} notifications as read for user {self.user.id}")
            return True
        except Exception as e:
            logger.exception(f"Error marking all notifications as read for user {self.user.id}: {str(e)}")
            return False