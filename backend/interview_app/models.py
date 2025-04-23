from django.db import models
from uuid import uuid4
from jobpost_app.models import JobApplication

class InterviewSchedule(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
    )
    INTERVIEW_TYPE_CHOICES = (
        ('AUDIO_ONLY', 'Audio Only'),
        ('VIDEO_ONLY', 'Video Only'),
        ('AUDIO_AND_VIDEO', 'Audio and Video'),
    )

    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='interviews')
    interview_date = models.DateField()
    interview_time = models.TimeField()
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES, default='AUDIO_AND_VIDEO')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    meeting_id = models.CharField(max_length=36, unique=True, default=uuid4)
    notes = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['interview_date', 'interview_time']
        indexes = [
            models.Index(fields=['interview_date', 'interview_time']),
            models.Index(fields=['status']),
            models.Index(fields=['interview_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.interview_type} Interview for {self.application.job_seeker.user.username} on {self.interview_date} at {self.interview_time} (Meeting ID: {self.meeting_id})"