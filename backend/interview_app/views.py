from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import JobApplication,  InterviewSchedule
from .serializer import  InterviewScheduleSerializer
from jobpost_app.serializer import JobApplicationDetailSerializer
from jobpost_app.models import JobPost
from auth_app.models import JobProvider
from django.utils import timezone
import logging
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
            return Response(serializer.data)
        
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
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