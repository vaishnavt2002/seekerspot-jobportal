# This is an update to interview_app/views.py to include notification functionality
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import JobApplication, InterviewSchedule
from .serializer import InterviewScheduleSerializer
from jobpost_app.serializer import JobApplicationDetailSerializer
from jobpost_app.models import JobPost
from auth_app.models import JobProvider
from django.utils import timezone
import logging
from django.core.mail import send_mail
from auth_app.models import JobSeeker
from notification_app.utils import *

logger = logging.getLogger(__name__)

class ShortlistedApplicantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            job_post = get_object_or_404(
                JobPost,
                pk=pk,
                job_provider=job_provider,
                is_deleted=False
            )
            applications = JobApplication.objects.filter(
                jobpost=job_post,
                status='SHORTLISTED'
            )
            serializer = JobApplicationDetailSerializer(applications, many=True)
            logger.info("Successfully returned %d shortlisted applications for job %s", len(serializer.data), pk)
            return Response(serializer.data)
        except JobProvider.DoesNotExist:
            logger.warning("Job provider profile not found for user %s", request.user.username)
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error("Error fetching shortlisted applicants for job %s: %s", pk, str(e), exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InterviewScheduleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            application = get_object_or_404(JobApplication, pk=request.data.get('application'))
            if application.jobpost.job_provider != job_provider:
                logger.warning("User %s attempted to schedule interview for application %s without permission",request.user.username, application.id)
                return Response(
                    {"error": "You do not have permission to schedule this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if application.status != 'SHORTLISTED':
                logger.warning("Attempted to schedule interview for non-shortlisted application %s (status: %s)",application.id, application.status)
                return Response(
                    {"error": "Interviews can only be scheduled for shortlisted applicants."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = InterviewScheduleSerializer(data=request.data)
            if serializer.is_valid():
                interview = serializer.save()
                
                # Send notification to the job seeker
                send_interview_scheduled_notification(interview)
                try:
                    job_seeker = application.job_seeker
                    job_seeker_email = job_seeker.user.email
                    job_seeker_name = f"{job_seeker.user.first_name} {job_seeker.user.last_name}"
                    job_title = application.jobpost.title
                    company_name = job_provider.company_name
                    
                    # Format the interview date and time
                    formatted_date = interview.interview_date.strftime("%A, %B %d, %Y")
                    formatted_time = interview.interview_time.strftime("%I:%M %p")
                    
                    # Get interview type
                    interview_type_display = dict(InterviewSchedule.INTERVIEW_TYPE_CHOICES)[interview.interview_type]
                    
                    # Get any additional notes
                    notes = interview.notes if interview.notes else "No additional notes provided."
                    
                    # Get meeting ID
                    meeting_id = interview.meeting_id
                    
                    # Send the email with detailed information
                    send_mail(
                        subject=f'Interview Scheduled: {job_title} at {company_name}',
                        message=f'''Dear {job_seeker_name},

We are pleased to inform you that your application for the position of "{job_title}" at {company_name} has moved forward, and an interview has been scheduled.

Interview Details:
- Date: {formatted_date}
- Time: {formatted_time}
- Type: {interview_type_display}
- Meeting ID: {meeting_id}

Additional Notes:
{notes}


We look forward to meeting you!

Regards,
{company_name} Hiring Team
via Seekerspot
                        ''',
                        from_email=None,
                        recipient_list=[job_seeker_email],
                        fail_silently=True,
                    )
                    logger.info(f"Interview confirmation email sent to {job_seeker_email}")
                except Exception as e:
                    # Log the error but don't stop the process
                    logger.error(f"Failed to send interview email notification: {str(e)}")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.warning("Invalid interview schedule data: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobProvider.DoesNotExist:
            logger.warning("Job provider profile not found for user %s", request.user.username)
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error("Error creating interview schedule: %s", str(e), exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InterviewScheduleUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            interview = get_object_or_404(InterviewSchedule, pk=pk)
            if interview.application.jobpost.job_provider != job_provider:
                logger.warning("User %s attempted to update interview %s without permission",request.user.username, pk)
                return Response(
                    {"error": "You do not have permission to update this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            original_date = interview.interview_date
            original_time = interview.interview_time
            original_type = interview.interview_type
            serializer = InterviewScheduleSerializer(interview, data=request.data, partial=True)
            if serializer.is_valid():
                updated_interview = serializer.save()
                
                # Send notification about the update
                
                try:
                    # Check if date, time, or type changed - only send reschedule email if something important changed
                    is_rescheduled = (
                        original_date != updated_interview.interview_date or
                        original_time != updated_interview.interview_time or
                        original_type != updated_interview.interview_type
                    )
                    
                    if is_rescheduled:
                        send_interview_updated_notification(updated_interview)
                        application = updated_interview.application
                        job_seeker = application.job_seeker
                        job_seeker_email = job_seeker.user.email
                        job_seeker_name = f"{job_seeker.user.first_name} {job_seeker.user.last_name}"
                        job_title = application.jobpost.title
                        company_name = job_provider.company_name
                        
                        # Format the interview date and time
                        formatted_date = updated_interview.interview_date.strftime("%A, %B %d, %Y")
                        formatted_time = updated_interview.interview_time.strftime("%I:%M %p")
                        
                        # Get interview type
                        interview_type_display = dict(InterviewSchedule.INTERVIEW_TYPE_CHOICES)[updated_interview.interview_type]
                        
                        # Get any additional notes
                        notes = updated_interview.notes if updated_interview.notes else "No additional notes provided."
                        
                        # Get meeting ID
                        meeting_id = updated_interview.meeting_id
                        
                        # Send the email with updated information
                        send_mail(
                            subject=f'RESCHEDULED: Interview for {job_title} at {company_name}',
                            message=f'''Dear {job_seeker_name},

Your interview for the position of "{job_title}" at {company_name} has been rescheduled. Please note the updated details below:

UPDATED Interview Details:
- Date: {formatted_date}
- Time: {formatted_time}
- Type: {interview_type_display}
- Meeting ID: {meeting_id}

Additional Notes:
{notes}


We apologize for any inconvenience and look forward to meeting you at the rescheduled time.

Regards,
{company_name} Hiring Team
via Seekerspot
                            ''',
                            from_email=None,
                            recipient_list=[job_seeker_email],
                            fail_silently=True,
                        )
                        logger.info(f"Interview reschedule notification sent to {job_seeker_email}")
                except Exception as e:
                    # Log the error but don't stop the process
                    logger.error(f"Failed to send interview reschedule notification: {str(e)}")
                
                logger.info("Interview %s successfully updated by user %s", pk, request.user.username)
                return Response(serializer.data)
            logger.warning("Invalid interview update data: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobProvider.DoesNotExist:
            logger.warning("Job provider profile not found for user %s", request.user.username)
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error("Error updating interview schedule %s: %s", pk, str(e), exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InterviewScheduleCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            interview = get_object_or_404(InterviewSchedule, pk=pk)
            if interview.application.jobpost.job_provider != job_provider:
                logger.warning("User %s attempted to cancel interview %s without permission",request.user.username, pk)
                return Response(
                    {"error": "You do not have permission to cancel this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if interview.status == 'CANCELLED':
                logger.warning("Attempted to cancel already cancelled interview %s", pk)
                return Response(
                    {"error": "Interview is already cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            interview.status = 'CANCELLED'
            interview.save()
            
            # Send notification about the cancellation
            send_interview_cancelled_notification(interview)
            try:
                application = interview.application
                job_seeker = application.job_seeker
                job_seeker_email = job_seeker.user.email
                job_seeker_name = f"{job_seeker.user.first_name} {job_seeker.user.last_name}"
                job_title = application.jobpost.title
                company_name = job_provider.company_name
                
                # Format the original interview date and time
                formatted_date = interview.interview_date.strftime("%A, %B %d, %Y")
                formatted_time = interview.interview_time.strftime("%I:%M %p")
                
                # Send the cancellation email
                send_mail(
                    subject=f'CANCELLED: Interview for {job_title} at {company_name}',
                    message=f'''Dear {job_seeker_name},

We regret to inform you that your interview for the position of "{job_title}" at {company_name} scheduled for {formatted_date} at {formatted_time} has been cancelled.



Your application is still under consideration, and we will contact you if we wish to reschedule the interview. Thank you for your understanding.

If you have any questions, please don't hesitate to contact us.

Regards,
{company_name} Hiring Team
via Seekerspot
                    ''',
                    from_email=None,
                    recipient_list=[job_seeker_email],
                    fail_silently=True,
                )
                logger.info(f"Interview cancellation notification sent to {job_seeker_email}")
            except Exception as e:
                # Log the error but don't stop the process
                logger.error(f"Failed to send interview cancellation notification: {str(e)}")
            
            logger.info("Interview %s successfully cancelled", pk)
            serializer = InterviewScheduleSerializer(interview)
            return Response(serializer.data)
        except JobProvider.DoesNotExist:
            logger.warning("Job provider profile not found for user %s", request.user.username)
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error("Error cancelling interview schedule %s: %s", pk, str(e), exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InterviewScheduleCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            interview = get_object_or_404(InterviewSchedule, pk=pk)
            if interview.application.jobpost.job_provider != job_provider:
                logger.warning("User %s attempted to complete interview %s without permission",request.user.username, pk)
                return Response(
                    {"error": "You do not have permission to complete this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if interview.status != 'SCHEDULED' and interview.status != 'RESCHEDULED':
                logger.warning("Attempted to complete interview %s with invalid status: %s", pk, interview.status)
                return Response(
                    {"error": "Only scheduled or rescheduled interviews can be marked as completed."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            interview.status = 'COMPLETED'
            interview.completed_at = timezone.now()
            interview.save()
            
            # Send notification to job seeker about completed interview
            job_seeker_user = interview.application.job_seeker.user
            job_title = interview.application.jobpost.title
            company_name = interview.application.jobpost.job_provider.company_name
            
            from notification_app.utils import send_notification
            from notification_app.models import Notification
            
            send_notification(
                user=job_seeker_user,
                notification_type=Notification.TYPE_INTERVIEW_UPDATED,
                title=f"Interview Completed: {job_title}",
                message=f"Your interview for {job_title} at {company_name} has been marked as completed",
                source_id=str(interview.id),
                source_type="interview"
            )
            
            serializer = InterviewScheduleSerializer(interview)
            logger.info("Interview %s successfully marked as completed", pk)
            return Response(serializer.data)
        except JobProvider.DoesNotExist:
            logger.warning("Job provider profile not found for user %s", request.user.username)
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error("Error completing interview schedule %s: %s", pk, str(e), exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class JobSeekerInterviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            applications = JobApplication.objects.filter(job_seeker=job_seeker)
            interviews = InterviewSchedule.objects.filter(application__in=applications)
            serializer = InterviewScheduleSerializer(interviews, many=True)
            logger.info("Successfully returned %d interviews for job seeker %s", len(serializer.data), request.user.username)
            return Response(serializer.data)
        except JobSeeker.DoesNotExist:
            logger.warning("Job seeker profile not found for user %s", request.user.username)
            return Response(
                {"error": "Job seeker profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error("Error fetching job seeker interviews: %s", str(e), exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MeetingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        try:
            interview = get_object_or_404(InterviewSchedule, meeting_id=meeting_id)
            
            # Log for debugging
            logger.info(f"Meeting request for ID {meeting_id} by user {request.user.id} ({request.user.user_type})")
            
            # Check if interview is active
            if interview.status == 'CANCELLED':
                return Response(
                    {"error": "This interview has been cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if interview.status == 'COMPLETED':
                return Response(
                    {"error": "This interview has already been completed."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if user has permission to access this meeting
            user = request.user
            has_permission = False
            
            if user.user_type == 'job_provider':
                try:
                    job_provider = JobProvider.objects.get(user=user)
                    # Log details for debugging
                    logger.info(f"Job provider ID: {job_provider.id}, Interview job provider ID: {interview.application.jobpost.job_provider.id}")
                    has_permission = interview.application.jobpost.job_provider.id == job_provider.id
                except JobProvider.DoesNotExist:
                    logger.error(f"Job provider profile not found for user {user.id}")
                    return Response(
                        {"error": "Job provider profile not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif user.user_type == 'job_seeker':
                try:
                    job_seeker = JobSeeker.objects.get(user=user)
                    # Log details for debugging
                    logger.info(f"Job seeker ID: {job_seeker.id}, Interview job seeker ID: {interview.application.job_seeker.id}")
                    has_permission = interview.application.job_seeker.id == job_seeker.id
                except JobSeeker.DoesNotExist:
                    logger.error(f"Job seeker profile not found for user {user.id}")
                    return Response(
                        {"error": "Job seeker profile not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                logger.warning(f"Invalid user type: {user.user_type}")
                return Response(
                    {"error": "Invalid user type for meeting access."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not has_permission:
                logger.warning(f"User {user.id} ({user.user_type}) attempted to access unauthorized meeting {meeting_id}")
                return Response(
                    {"error": "You do not have permission to access this meeting."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Return meeting details
            serializer = InterviewScheduleSerializer(interview)
            
            # Add job details and participant info
            job_post = interview.application.jobpost
            job_seeker = interview.application.job_seeker
            job_provider = job_post.job_provider
            
            # Prepare response data
            response_data = {
                **serializer.data,
                'job_title': job_post.title,
                'company_name': job_provider.company_name,
                'job_seeker_id': job_seeker.id,
                'job_seeker_name': f"{job_seeker.user.first_name} {job_seeker.user.last_name}".strip() or "Job Seeker",
                'job_provider_id': job_provider.id,
                'job_provider_name': job_provider.company_name
            }
            
            logger.info(f"Successfully returned meeting details for {meeting_id}")
            return Response(response_data)
            
        except Exception as e:
            logger.exception(f"Error getting meeting details: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )