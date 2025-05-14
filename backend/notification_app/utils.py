from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import logging
from .models import Notification

logger = logging.getLogger(__name__)

def send_notification(user, notification_type, title, message, source_id=None, source_type=None):
    """
    Create and send a notification to a user
    
    Args:
        user: User to send notification to
        notification_type: Type of notification (from Notification.NOTIFICATION_TYPES)
        title: Notification title
        message: Notification message
        source_id: ID of related object (optional)
        source_type: Type of related object (optional)
    
    Returns:
        The created notification
    """
    try:
        logger.info(f"Creating notification for user {user.id}: {notification_type} - {title}")
        
        # Create notification in database
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            source_id=source_id,
            source_type=source_type
        )
        
        # Send to WebSocket if channel layer available
        try:
            channel_layer = get_channel_layer()
            if channel_layer is None:
                logger.error("No channel layer available for sending notifications")
                return notification
                
            notification_data = {
                'type': 'notification_message',
                'notification': {
                    'id': str(notification.id),
                    'title': notification.title,
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'created_at': notification.created_at.isoformat(),
                    'source_id': notification.source_id,
                    'source_type': notification.source_type,
                    'is_read': notification.is_read
                }
            }
            
            # Send to the user's notification group
            group_name = f'notifications_{user.id}'
            logger.info(f"Sending notification to channel group: {group_name}")
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                notification_data
            )
            
            logger.info(f"Notification sent to user {user.id} via WebSocket")
        except Exception as e:
            logger.exception(f"Failed to send notification via WebSocket: {str(e)}")
        
        return notification
    except Exception as e:
        logger.exception(f"Failed to create notification: {str(e)}")
        return None

def send_application_status_notification(application):
    """
    Send notification about job application status change
    
    Args:
        application: JobApplication instance
    """
    job_seeker_user = application.job_seeker.user
    job_title = application.jobpost.title
    company_name = application.jobpost.job_provider.company_name
    status = application.status
    
    title = f"Application Status Update: {job_title}"
    message = f"Your application for {job_title} at {company_name} has been updated to: {status}"
    
    send_notification(
        user=job_seeker_user,
        notification_type=Notification.TYPE_APPLICATION_UPDATE,
        title=title,
        message=message,
        source_id=str(application.id),
        source_type="application"
    )

def send_interview_scheduled_notification(interview):
    """
    Send notification about a scheduled interview
    
    Args:
        interview: InterviewSchedule instance
    """
    job_seeker_user = interview.application.job_seeker.user
    job_title = interview.application.jobpost.title
    company_name = interview.application.jobpost.job_provider.company_name
    
    # Format date and time separately and then combine them
    formatted_date = interview.interview_date.strftime("%A, %B %d, %Y")
    formatted_time = interview.interview_time.strftime("%I:%M %p")
    formatted_datetime = f"{formatted_date} at {formatted_time}"
    
    title = f"Interview Scheduled: {job_title}"
    message = f"You have an interview for {job_title} at {company_name} scheduled for {formatted_datetime}"
    
    send_notification(
        user=job_seeker_user,
        notification_type=Notification.TYPE_INTERVIEW_SCHEDULED,
        title=title,
        message=message,
        source_id=str(interview.id),
        source_type="interview"
    )

def send_interview_updated_notification(interview):
    """
    Send notification about an updated interview
    
    Args:
        interview: InterviewSchedule instance
    """
    job_seeker_user = interview.application.job_seeker.user
    job_title = interview.application.jobpost.title
    company_name = interview.application.jobpost.job_provider.company_name
    
    # Format date and time separately and then combine them
    formatted_date = interview.interview_date.strftime("%A, %B %d, %Y")
    formatted_time = interview.interview_time.strftime("%I:%M %p")
    formatted_datetime = f"{formatted_date} at {formatted_time}"
    
    title = f"Interview Rescheduled: {job_title}"
    message = f"Your interview for {job_title} at {company_name} has been rescheduled to {formatted_datetime}"
    
    send_notification(
        user=job_seeker_user,
        notification_type=Notification.TYPE_INTERVIEW_UPDATED,
        title=title,
        message=message,
        source_id=str(interview.id),
        source_type="interview"
    )

def send_interview_cancelled_notification(interview):
    """
    Send notification about a cancelled interview
    
    Args:
        interview: InterviewSchedule instance
    """
    job_seeker_user = interview.application.job_seeker.user
    job_title = interview.application.jobpost.title
    company_name = interview.application.jobpost.job_provider.company_name
    
    # No need for scheduled time formatting since we're just notifying of cancellation
    title = f"Interview Cancelled: {job_title}"
    message = f"Your interview for {job_title} at {company_name} has been cancelled"
    
    send_notification(
        user=job_seeker_user,
        notification_type=Notification.TYPE_INTERVIEW_CANCELLED,
        title=title,
        message=message,
        source_id=str(interview.id),
        source_type="interview"
    )
def send_job_applied_notification(application):
    """
    Send notification to job provider when someone applies for a job
    
    Args:
        application: JobApplication instance
    """
    job_provider_user = application.jobpost.job_provider.user
    job_title = application.jobpost.title
    job_seeker_name = f"{application.job_seeker.user.first_name} {application.job_seeker.user.last_name}".strip()
    
    title = f"New Application: {job_title}"
    message = f"{job_seeker_name} has applied for the {job_title} position"
    
    send_notification(
        user=job_provider_user,
        notification_type=Notification.TYPE_JOB_APPLIED,
        title=title,
        message=message,
        source_id=str(application.id),
        source_type="application"
    )