import uuid
from django.db import models
from django.conf import settings

class Notification(models.Model):
    """Model for user notifications"""
    
    # Notification types
    TYPE_APPLICATION_UPDATE = 'application_update'
    TYPE_INTERVIEW_SCHEDULED = 'interview_scheduled'
    TYPE_INTERVIEW_UPDATED = 'interview_updated'
    TYPE_INTERVIEW_CANCELLED = 'interview_cancelled'
    TYPE_JOB_APPLIED = 'job_applied'
    TYPE_SYSTEM = 'system'
    
    NOTIFICATION_TYPES = [
        (TYPE_APPLICATION_UPDATE, 'Application Update'),
        (TYPE_INTERVIEW_SCHEDULED, 'Interview Scheduled'),
        (TYPE_INTERVIEW_UPDATED, 'Interview Updated'),
        (TYPE_INTERVIEW_CANCELLED, 'Interview Cancelled'),
        (TYPE_JOB_APPLIED, 'Job Applied'),
        (TYPE_SYSTEM, 'System Notification'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default=TYPE_SYSTEM)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    source_id = models.CharField(max_length=255, blank=True, null=True)  # ID of the related object (job post, application, etc.)
    source_type = models.CharField(max_length=50, blank=True, null=True)  # Type of the related object

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['user', 'notification_type']),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.user.username}: {self.title}"