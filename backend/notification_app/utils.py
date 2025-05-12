# notification_app/utils.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from .serializer import NotificationSerializer

channel_layer = get_channel_layer()

def send_notification(user, notification_type, title, message, source_id=None, source_type=None):
    """
    Simple utility function to create and send a notification
    
    Args:
        user: User who will receive the notification
        notification_type: Type of notification (from Notification.NOTIFICATION_TYPES)
        title: Title of the notification
        message: Content of the notification
        source_id: Optional ID of the source object (e.g., application_id)
        source_type: Optional type of the source object (e.g., "application")
    """
    # Create notification in database
    notification = Notification.objects.create(
        recipient=user,
        type=notification_type,
        title=title,
        message=message,
        source_id=source_id,
        source_type=source_type
    )
    
    # Get serialized notification data
    notification_data = NotificationSerializer(notification).data
    
    # Get updated unread count
    count = Notification.objects.filter(recipient=user, is_read=False).count()
    
    # Send to user's notification group
    group_name = f'user_{user.id}_notifications'
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'notification_event',
            'notification': notification_data,
            'count': count
        }
    )
    
    return notification