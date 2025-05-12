from django.db import models
from auth_app.models import User
# Create your models here.
class Notification(models.Model):
    # Basic notification types we'll start with
    TYPE_APPLICATION_UPDATE = 'application_update'
    TYPE_COMMUNITY_MESSAGE = 'community_message'
    TYPE_GENERAL = 'general'
    
    NOTIFICATION_TYPES = [
        (TYPE_APPLICATION_UPDATE, 'Application Update'),
        (TYPE_COMMUNITY_MESSAGE, 'Community Message'),
        (TYPE_GENERAL, 'General Notification'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    # Store source object IDs
    source_id = models.CharField(max_length=50, blank=True, null=True)
    source_type = models.CharField(max_length=50, blank=True, null=True)
    # Status
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']