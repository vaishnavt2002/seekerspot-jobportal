from django.db import models
from auth_app.models import User, JobSeeker, JobProvider
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from cloudinary.models import CloudinaryField
from .storage import CommunityAttachmentStorage

class Community(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    cover_image = CloudinaryField('image', folder='community_covers/', blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_communities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['name']),  # Index for faster searches
        ]

class CommunityMember(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} in {self.community.name}"

    def clean(self):
        # Ensure only job_seeker or job_provider can join communities
        if self.user.user_type not in ['job_seeker', 'job_provider']:
            raise ValidationError("Only job seekers and job providers can join communities.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Run validation before saving
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('community', 'user') 
        indexes = [
            models.Index(fields=['community', 'user']),
        ]

class CommunityMessage(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_messages')
    content = models.TextField(blank=True, null=True)
    attachment = models.FileField(
        upload_to='community_attachments/',
        storage=CommunityAttachmentStorage(), 
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message by {self.sender.username} in {self.community.name}"

    class Meta:
        indexes = [
            models.Index(fields=['community', 'created_at']),
        ]

class UserReadStatus(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_statuses')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='read_statuses')
    last_read_message = models.ForeignKey(CommunityMessage, on_delete=models.SET_NULL, null=True, blank=True)
    last_read_time = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'community')
        indexes = [
            models.Index(fields=['user', 'community']),
        ]

    def __str__(self):
        return f"{self.user.username}'s read status in {self.community.name}"