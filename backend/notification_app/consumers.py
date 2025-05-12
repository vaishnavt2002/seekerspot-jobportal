# notification_app/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Notification
import logging
from .serializer import *

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return
        
        # Create user-specific notification group
        self.group_name = f'user_{self.user.id}_notifications'
        
        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial unread count
        count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': count
        }))

    async def disconnect(self, close_code):
        # Leave the group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'mark_read':
            notification_id = data.get('id')
            if notification_id:
                await self.mark_as_read(notification_id)
            else:
                await self.mark_all_read()
            
            # Send updated count
            count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': count
            }))
        
        elif action == 'get_notifications':
            notifications = await self.get_notifications()
            await self.send(text_data=json.dumps({
                'type': 'notifications',
                'notifications': notifications
            }))

    # Handle notification event from channel layer
    async def notification_event(self, event):
        # Forward to client
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification'],
            'count': event['count']
        }))

    @database_sync_to_async
    def get_unread_count(self):
        return Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).count()

    @database_sync_to_async
    def get_notifications(self):
        notifications = Notification.objects.filter(
            recipient=self.user
        )[:20]  # Simple limit to last 20
        
        return NotificationSerializer(notifications, many=True).data

    @database_sync_to_async
    def mark_as_read(self, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.is_read = True
            notification.save()
            return True
        except:
            return False

    @database_sync_to_async
    def mark_all_read(self):
        Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).update(is_read=True)
        return True