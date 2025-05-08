from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from profile_app.permissions import IsJobProvier
from .models import JobPost, Skills, JobApplication, SavedJob
from .serializer import *
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from auth_app.models import JobSeeker
from profile_app.models import JobSeekerSkill
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
import logging
logger = logging.getLogger(__name__)

from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)


class JobPostView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def validate_string_param(self, param, max_length=255):
        """Validate and sanitize string parameters"""
        if param is None:
            return ""
        # Trim whitespace and limit length
        return str(param).strip()[:max_length]
    
    def validate_enum_param(self, param, valid_values, default=""):
        """Validate parameters against a list of valid values"""
        if param is None or param not in valid_values:
            return default
        return param
    
    def get(self, request):
        try:
            # Validate page parameter
            try:
                page = request.query_params.get('page', '1')
                # Ensure page is numeric and positive
                if not page.isdigit() or int(page) < 1:
                    return Response(
                        {'error': 'Invalid page number. Must be a positive integer.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                page = int(page)
            except (ValueError, TypeError) as e:
                logger.warning(
                    f"Invalid page parameter: {request.query_params.get('page', '1')}, Error: {str(e)}"
                )
                return Response(
                    {'error': 'Invalid page number format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate page_size parameter
            try:
                page_size = request.query_params.get('page_size', '16')
                # Ensure page_size is numeric and positive
                if not page_size.isdigit() or int(page_size) < 1 or int(page_size) > 100:
                    return Response(
                        {'error': 'Invalid page size. Must be a positive integer not exceeding 100.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                page_size = int(page_size)
            except (ValueError, TypeError) as e:
                logger.warning(
                    f"Invalid page_size parameter: {request.query_params.get('page_size', '16')}, Error: {str(e)}"
                )
                return Response(
                    {'error': 'Invalid page size format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate and sanitize text search parameters
            search = self.validate_string_param(request.query_params.get('search', ''), max_length=100)
            
            # Get valid values from models (assuming these are choices in your models)
            # Replace these with your actual model choices
            valid_job_types = ['full_time', 'part_time', 'contract', 'internship']  # Example
            valid_statuses = ['active', 'pending', 'closed', 'draft']  # Example
            valid_domains = ['tech', 'finance', 'healthcare', 'education']  # Example
            valid_sorts = ['', 'created_at', '-created_at', 'title', '-title']
            
            # Validate enum parameters
            job_type = self.validate_enum_param(
                request.query_params.get('job_type', ''),
                valid_job_types
            )
            status_param = self.validate_enum_param(
                request.query_params.get('status', ''),
                valid_statuses
            )
            domain = self.validate_enum_param(
                request.query_params.get('domain', ''),
                valid_domains
            )
            sort = self.validate_enum_param(
                request.query_params.get('sort', ''),
                valid_sorts
            )
            
            # Check job provider profile
            try:
                job_provider = request.user.job_provider_profile
            except AttributeError as e:
                logger.warning(
                    f"User {request.user.username} (ID: {request.user.id}) attempted to access JobPostView without a job provider profile"
                )
                return Response(
                    {'error': 'User is not associated with a job provider profile'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Build query with validated parameters
            job_posts = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            )
            
            # Apply filters with sanitized parameters
            if search:
                job_posts = job_posts.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search) |
                    Q(location__icontains=search)
                )
            
            if job_type:
                job_posts = job_posts.filter(job_type=job_type)
            
            if status_param:
                job_posts = job_posts.filter(status=status_param)
            
            if domain:
                job_posts = job_posts.filter(domain=domain)
            
            if sort:
                job_posts = job_posts.order_by(sort)
            
            # Pagination
            paginator = Paginator(job_posts, page_size)
            try:
                paginated_jobs = paginator.page(page)
            except Exception as e:
                logger.warning(
                    f"Page {page} not found for job provider {job_provider.id}, Error: {str(e)}"
                )
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize and return response
            serializer = JobPostSerializer(paginated_jobs, many=True)
            return Response({
                'results': serializer.data,
                'next': None if not paginated_jobs.has_next() else page + 1,
                'previous': None if not paginated_jobs.has_previous() else page - 1,
                'count': paginator.count,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Log the full exception details with traceback
            logger.error(
                f"Unexpected error in JobPostView.get: {str(e)}",
                exc_info=True  # This includes traceback information
            )
            return Response(
                {'error': 'Server error occurred'},  # Don't expose error details in production
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        try:
            # Sanitize request data before validation
            sanitized_data = {}
            for key, value in request.data.items():
                if isinstance(value, str):
                    sanitized_data[key] = self.validate_string_param(value)
                else:
                    sanitized_data[key] = value
            
            serializer = JobPostSerializer(data=sanitized_data, context={'request': request})
            if serializer.is_valid():
                job_post = serializer.save(job_provider=request.user.job_provider_profile)
                logger.info(f"New job post created: ID {job_post.id} by provider {request.user.job_provider_profile.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # Log validation errors
            logger.warning(
                f"Validation error in JobPostView.post for user {request.user.id}: {serializer.errors}"
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(
                f"Unexpected error in JobPostView.post: {str(e)}",
                exc_info=True
            )
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class JobPostDetailView(APIView):
    permission_classes = [IsAuthenticated, IsJobProvier]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk, job_provider):
        try:
            return JobPost.objects.get(pk=pk, job_provider=job_provider, is_deleted=False)
        except JobPost.DoesNotExist:
            return None

    def get(self, request, pk):
        job_post = self.get_object(pk, request.user.job_provider_profile)
        if job_post is None:
            return Response({"error": "Job post not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobPostSerializer(job_post)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        job_post = self.get_object(pk, request.user.job_provider_profile)
        if job_post is None:
            return Response({"error": "Job post not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobPostSerializer(job_post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        job_post = self.get_object(pk, request.user.job_provider_profile)
        if job_post is None:
            return Response({"error": "Job post not found."}, status=status.HTTP_404_NOT_FOUND)
        job_post.delete()
        return Response({"message": "Job post marked as deleted."}, status=status.HTTP_200_OK)

class PublicJobPostPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100

class PublicJobPostListView(APIView):
    pagination_class = PublicJobPostPagination

    def get(self, request):
        search = request.query_params.get("search", "")
        location = request.query_params.get("location", "")
        job_type = request.query_params.get("job_type", "")
        employment_type = request.query_params.get("employment_type", "")
        domain = request.query_params.get("domain", "")
        skill = request.query_params.get("skill", "")

        jobs = JobPost.objects.filter(
            status="PUBLISHED",
            is_deleted=False,
            application_deadline__gte=timezone.now(),
        )

        if search:
            jobs = jobs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(job_provider__company_name__icontains=search)
            )
        if location:
            jobs = jobs.filter(location__icontains=location)
        if job_type:
            jobs = jobs.filter(job_type=job_type)
        if employment_type:
            jobs = jobs.filter(employment_type=employment_type)
        if domain:
            jobs = jobs.filter(domain=domain)
        if skill:
            jobs = jobs.filter(skills__name__icontains=skill)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(jobs.order_by("-created_at"), request)
        serializer = PublicJobPostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
class PublicJobPostDetailView(APIView):
    def get(self, request, job_id):
        try:
            job = JobPost.objects.get(
                id=job_id,
                status="PUBLISHED",
                is_deleted=False,
                application_deadline__gte=timezone.now(),
            )
            serializer = PublicJobPostSerializer(job)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except JobPost.DoesNotExist:
            return Response(
                {"error": "Job not found or not available."},
                status=status.HTTP_404_NOT_FOUND
            )

class SkillSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("query", "")
        skills = Skills.objects.filter(name__icontains=query)[:10]
        serializer = SkillSerializer(skills, many=True)
        print(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class JobSeekerSkillsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            job_seeker_skills = JobSeekerSkill.objects.filter(job_seeker=job_seeker)
            skills = [js_skill.skill for js_skill in job_seeker_skills]
            
            serializer = SkillSerializer(skills, many=True)
            
            print(f"User {request.user.username} has {len(skills)} skills")

            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except JobSeeker.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            return Response([], status=status.HTTP_200_OK)

class AddSkillsToProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            skill_ids = request.data.get('skill_ids', [])
            
            if not skill_ids:
                return Response(
                    {"error": "No skills provided to add."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            added_skills = []
            for skill_id in skill_ids:
                try:
                    skill = Skills.objects.get(id=skill_id)
                    # Use get_or_create to avoid duplicates
                    obj, created = JobSeekerSkill.objects.get_or_create(
                        job_seeker=job_seeker,
                        skill=skill
                    )
                    added_skills.append(skill)
                except Skills.DoesNotExist:
                    continue
            
            all_skills = [js_skill.skill for js_skill in JobSeekerSkill.objects.filter(job_seeker=job_seeker)]
            serializer = SkillSerializer(all_skills, many=True)
            
            return Response({
                "message": f"Successfully added {len(added_skills)} skills to your profile",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
class ApplyForJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if not request.user.first_name or not request.user.last_name:
                return Response(
                    {"error": "First name and last name are required to apply for a job."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            job_seeker = JobSeeker.objects.get(user=request.user)
            job_id = request.data.get('jobpost_id')
            
            if not job_id:
                return Response(
                    {"error": "jobpost_id is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                job = JobPost.objects.get(
                    id=job_id,
                    status="PUBLISHED",
                    is_deleted=False,
                    application_deadline__gte=timezone.now(),
                )
            except JobPost.DoesNotExist:
                return Response(
                    {"error": "Job not found or not available for application."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if JobApplication.objects.filter(jobpost=job, job_seeker=job_seeker).exists():
                return Response(
                    {"error": "You have already applied for this job."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            application = JobApplication.objects.create(
                jobpost=job,
                job_seeker=job_seeker,
                status="APPLIED"
            )
            
            serializer = JobApplicationSerializer(application)
            
            # Get user skills and job skills for informational purposes
            user_skill_ids = set(js_skill.skill.id for js_skill in JobSeekerSkill.objects.filter(job_seeker=job_seeker))
            job_skill_ids = set(skill.id for skill in job.skills.all())
            
            # Calculate matching skills percentage
            total_job_skills = len(job_skill_ids)
            matching_skills = len(user_skill_ids.intersection(job_skill_ids))
            match_percentage = (matching_skills / total_job_skills * 100) if total_job_skills > 0 else 0
            
            # Include this info in the response
            response_data = serializer.data
            response_data.update({
                "message": "Successfully applied for the job!",
                "skill_match": {
                    "matching_skills": matching_skills,
                    "total_skills": total_job_skills,
                    "match_percentage": round(match_percentage, 1)
                }
            })
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
class ApplicationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        """Check application status for a specific job"""
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            try:
                application = JobApplication.objects.get(
                    jobpost_id=job_id,
                    job_seeker=job_seeker
                )
                serializer = JobApplicationSerializer(application)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except JobApplication.DoesNotExist:
                return Response(
                    {"status": "NOT_APPLIED", "message": "You have not applied for this job yet."},
                    status=status.HTTP_200_OK
                )
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found.", "status": "ERROR"},
                status=status.HTTP_404_NOT_FOUND
            )
        
class SaveJobView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            jobpost_id = request.data.get('jobpost_id')
            
            if not jobpost_id:
                return Response(
                    {"error": "Job post ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                jobpost = JobPost.objects.get(id=jobpost_id)
            except JobPost.DoesNotExist:
                return Response(
                    {"error": "Job post not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if already saved
            saved_job, created = SavedJob.objects.get_or_create(
                job_seeker=job_seeker,
                jobpost=jobpost
            )
            
            if created:
                serializer = SavedJobSerializer(saved_job)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"message": "Job already saved", "saved_job": SavedJobSerializer(saved_job).data},
                    status=status.HTTP_200_OK
                )
                
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class UnsaveJobView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, job_id):
        """Unsave a job for the current user"""
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            try:
                saved_job = SavedJob.objects.get(
                    job_seeker=job_seeker,
                    jobpost_id=job_id
                )
                saved_job.delete()
                return Response(
                    {"message": "Job removed from saved list"},
                    status=status.HTTP_200_OK
                )
            except SavedJob.DoesNotExist:
                return Response(
                    {"error": "Job was not saved"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class SavedJobStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, job_id):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            is_saved = SavedJob.objects.filter(
                job_seeker=job_seeker,
                jobpost_id=job_id
            ).exists()
            
            return Response(
                {"is_saved": is_saved},
                status=status.HTTP_200_OK
            )
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found", "is_saved": False},
                status=status.HTTP_404_NOT_FOUND
            )


class JobPostListView(APIView):

    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            job_posts = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            ).order_by('-created_at')
            
            serializer = JobPostListSerializer(job_posts, many=True)
            return Response(serializer.data)
        
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class JobPostDetailForApplicantsView(APIView):

    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        logger.info("This is an info message from my_view.")
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            job_post = get_object_or_404(
                JobPost, 
                pk=pk, 
                job_provider=job_provider,
                is_deleted=False
            )
            
            serializer = JobPostListSerializer(job_post)
            return Response(serializer.data)
        
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class JobPostApplicantsView(APIView):

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
            
            applications = JobApplication.objects.filter(jobpost=job_post)
            
            serializer = JobApplicationDetailSerializer(applications, many=True)
            return Response(serializer.data)
        
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class JobApplicationStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(user=request.user)
            application = get_object_or_404(JobApplication, pk=pk)
            
            if application.jobpost.job_provider != job_provider:
                return Response(
                    {"error": "You do not have permission to update this application."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if 'status' in request.data:
                status_value = request.data['status']
                valid_statuses = [status_choice[0] for status_choice in JobApplication.STATUS_CHOICES]
                
                if status_value not in valid_statuses:
                    return Response(
                        {"error": f"Invalid status value. Must be one of: {', '.join(valid_statuses)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                application.status = status_value
                application.save()
                
                serializer = JobApplicationDetailSerializer(application)
                return Response(serializer.data)
            
            return Response(
                {"error": "Only 'status' field can be updated."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except JobProvider.DoesNotExist:
            return Response(
                {"error": "Job provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
class JobSeekerApplicationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            applications = JobApplication.objects.filter(job_seeker=job_seeker).select_related('jobpost__job_provider')
            serializer = JobSeekerApplicationSerializer(applications, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching job seeker applications: {str(e)}")
            return Response(
                {"error": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )