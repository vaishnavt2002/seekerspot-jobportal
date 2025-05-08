# interview_app/views.py
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
from auth_app.models import JobSeeker

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
                return Response(
                    {"error": "You do not have permission to schedule this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if application.status != 'SHORTLISTED':
                return Response(
                    {"error": "Interviews can only be scheduled for shortlisted applicants."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = InterviewScheduleSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class InterviewScheduleUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            interview = get_object_or_404(InterviewSchedule, pk=pk)
            if interview.application.jobpost.job_provider != job_provider:
                return Response(
                    {"error": "You do not have permission to update this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = InterviewScheduleSerializer(interview, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class InterviewScheduleCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            interview = get_object_or_404(InterviewSchedule, pk=pk)
            if interview.application.jobpost.job_provider != job_provider:
                return Response(
                    {"error": "You do not have permission to cancel this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if interview.status == 'CANCELLED':
                return Response(
                    {"error": "Interview is already cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            interview.status = 'CANCELLED'
            interview.save()
            serializer = InterviewScheduleSerializer(interview)
            return Response(serializer.data)
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class InterviewScheduleCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            interview = get_object_or_404(InterviewSchedule, pk=pk)
            if interview.application.jobpost.job_provider != job_provider:
                return Response(
                    {"error": "You do not have permission to complete this interview."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if interview.status != 'SCHEDULED' and interview.status != 'RESCHEDULED':
                return Response(
                    {"error": "Only scheduled or rescheduled interviews can be marked as completed."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            interview.status = 'COMPLETED'
            interview.completed_at = timezone.now()
            interview.save()
            serializer = InterviewScheduleSerializer(interview)
            return Response(serializer.data)
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class JobSeekerInterviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            applications = JobApplication.objects.filter(job_seeker=job_seeker)
            interviews = InterviewSchedule.objects.filter(application__in=applications)
            serializer = InterviewScheduleSerializer(interviews, many=True)
            return Response(serializer.data)
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found."},
                status=status.HTTP_404_NOT_FOUND
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
