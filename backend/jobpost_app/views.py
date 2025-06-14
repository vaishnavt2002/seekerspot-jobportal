from http.client import ImproperConnectionState
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
from django.core.paginator import Paginator,EmptyPage
import logging
import bleach
from django.core.mail import send_mail
from notification_app.utils import send_notification
from notification_app.models import Notification
from notification_app.utils import *
from notification_app.utils import send_job_applied_notification
logger = logging.getLogger(__name__)


from django.conf import settings

# Configure logger for this module
logger = logging.getLogger(__name__)


class JobPostView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    # Hard-coded capital choices from model
    VALID_JOB_TYPES = ['REMOTE', 'HYBRID', 'ONSITE']
    VALID_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'TRAINEE', 'CONTRACT']
    VALID_DOMAINS = ['ACCOUNTING', 'IT', 'MANAGEMENT', 'MARKETING', 'ENGINEERING', 'HEALTHCARE', 'EDUCATION', 'OTHER']
    VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED']
    VALID_SORTS = ['created_at', '-created_at', 'title', '-title']
    
    def sanitize_text(self, text, max_length=None):
        """Sanitize text input to prevent XSS attacks"""
        if text is None:
            return ""
        # Clean the text with bleach to remove potentially harmful HTML
        cleaned_text = bleach.clean(str(text).strip(), strip=True)
        if max_length and len(cleaned_text) > max_length:
            cleaned_text = cleaned_text[:max_length]
        return cleaned_text
    
    def get(self, request):
        try:
            # Validate pagination parameters
            try:
                page = request.query_params.get('page', '1')
                if not page.isdigit() or int(page) < 1:
                    return Response(
                        {'error': 'Page must be a positive integer'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                page = int(page)
                
                page_size = request.query_params.get('page_size', '16')
                if not page_size.isdigit() or int(page_size) < 1 or int(page_size) > 100:
                    return Response(
                        {'error': 'Page size must be between 1 and 100'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                page_size = int(page_size)
            except ValueError:
                return Response(
                    {'error': 'Invalid pagination parameters'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get and sanitize search parameter
            search = self.sanitize_text(request.query_params.get('search', ''), max_length=100)
            
            # Initialize filter parameters
            filter_params = {}
            
            # Job type filter - validate against hard-coded values
            job_type = request.query_params.get('job_type', '').upper()
            if job_type and job_type in self.VALID_JOB_TYPES:
                filter_params['job_type'] = job_type
            elif job_type:
                return Response(
                    {'error': f"Invalid job_type. Must be one of {self.VALID_JOB_TYPES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Employment type filter
            employment_type = request.query_params.get('employment_type', '').upper()
            if employment_type and employment_type in self.VALID_EMPLOYMENT_TYPES:
                filter_params['employment_type'] = employment_type
            elif employment_type:
                return Response(
                    {'error': f"Invalid employment_type. Must be one of {self.VALID_EMPLOYMENT_TYPES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Status filter
            status_param = request.query_params.get('status', '').upper()
            if status_param and status_param in self.VALID_STATUSES:
                filter_params['status'] = status_param
            elif status_param:
                return Response(
                    {'error': f"Invalid status. Must be one of {self.VALID_STATUSES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Domain filter
            domain = request.query_params.get('domain', '').upper()
            if domain and domain in self.VALID_DOMAINS:
                filter_params['domain'] = domain
            elif domain:
                return Response(
                    {'error': f"Invalid domain. Must be one of {self.VALID_DOMAINS}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Experience level filter
            try:
                min_experience = request.query_params.get('min_experience', '')
                if min_experience:
                    min_experience = int(min_experience)
                    if min_experience < 0:
                        return Response(
                            {'error': 'Minimum experience cannot be negative'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    filter_params['experience_level__gte'] = min_experience
            except ValueError:
                return Response(
                    {'error': 'Minimum experience must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                max_experience = request.query_params.get('max_experience', '')
                if max_experience:
                    max_experience = int(max_experience)
                    if max_experience < 0:
                        return Response(
                            {'error': 'Maximum experience cannot be negative'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    filter_params['experience_level__lte'] = max_experience
            except ValueError:
                return Response(
                    {'error': 'Maximum experience must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate sort parameter
            sort = request.query_params.get('sort', '-created_at')
            if sort not in self.VALID_SORTS:
                return Response(
                    {'error': f"Invalid sort parameter. Must be one of {self.VALID_SORTS}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check job provider profile
            try:
                job_provider = request.user.job_provider_profile
            except AttributeError:
                return Response(
                    {'error': 'User is not associated with a job provider profile'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Build query with validated parameters
            job_posts = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False,
                **filter_params
            )
            
            # Apply search filter if provided
            if search:
                job_posts = job_posts.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search) |
                    Q(location__icontains=search)
                )
            
            # Apply sort
            job_posts = job_posts.order_by(sort)
            
            # Pagination
            paginator = Paginator(job_posts, page_size)
            try:
                paginated_jobs = paginator.page(page)
            except EmptyPage:
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
            logger.error(f"Unexpected error in JobPostView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        try:
            # Check job provider profile
            try:
                job_provider = request.user.job_provider_profile
            except AttributeError:
                return Response(
                    {'error': 'User is not associated with a job provider profile'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            data = request.data.copy()
            
            # Validate choice fields
            # Job type
            job_type = data.get('job_type', '').upper()
            if not job_type:
                return Response(
                    {'error': 'job_type is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if job_type not in self.VALID_JOB_TYPES:
                return Response(
                    {'error': f"Invalid job_type. Must be one of {self.VALID_JOB_TYPES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data['job_type'] = job_type
            
            # Employment type
            employment_type = data.get('employment_type', '').upper()
            if not employment_type:
                return Response(
                    {'error': 'employment_type is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if employment_type not in self.VALID_EMPLOYMENT_TYPES:
                return Response(
                    {'error': f"Invalid employment_type. Must be one of {self.VALID_EMPLOYMENT_TYPES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data['employment_type'] = employment_type
            
            # Domain
            domain = data.get('domain', '').upper()
            if not domain:
                return Response(
                    {'error': 'domain is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if domain not in self.VALID_DOMAINS:
                return Response(
                    {'error': f"Invalid domain. Must be one of {self.VALID_DOMAINS}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data['domain'] = domain
            
            # Status (optional, has default)
            status_param = data.get('status', 'DRAFT').upper()
            if status_param not in self.VALID_STATUSES:
                return Response(
                    {'error': f"Invalid status. Must be one of {self.VALID_STATUSES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data['status'] = status_param
            
            # Numeric fields validation
            # Experience level
            try:
                experience_level = data.get('experience_level')
                if experience_level is None:
                    return Response(
                        {'error': 'experience_level is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                experience_level = int(experience_level)
                if experience_level < 0:
                    return Response(
                        {'error': 'experience_level cannot be negative'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                data['experience_level'] = experience_level
            except ValueError:
                return Response(
                    {'error': 'experience_level must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Salary fields
            try:
                min_salary = data.get('min_salary')
                if min_salary is None:
                    return Response(
                        {'error': 'min_salary is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                min_salary = int(min_salary)
                if min_salary < 0:
                    return Response(
                        {'error': 'min_salary cannot be negative'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                data['min_salary'] = min_salary
            except ValueError:
                return Response(
                    {'error': 'min_salary must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                max_salary = data.get('max_salary')
                if max_salary is None:
                    return Response(
                        {'error': 'max_salary is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                max_salary = int(max_salary)
                if max_salary < 0:
                    return Response(
                        {'error': 'max_salary cannot be negative'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                data['max_salary'] = max_salary
            except ValueError:
                return Response(
                    {'error': 'max_salary must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Ensure max_salary is greater than or equal to min_salary
            if min_salary > max_salary:
                return Response(
                    {'error': 'max_salary must be greater than or equal to min_salary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate application_deadline
            application_deadline = data.get('application_deadline')
            if not application_deadline:
                return Response(
                    {'error': 'application_deadline is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Sanitize text fields (title, location, description)
            for field in ['title', 'location', 'description']:
                if not data.get(field):
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Apply proper sanitization using the sanitize_text method
                max_length = 255 if field in ['title', 'location'] else None
                data[field] = self.sanitize_text(data[field], max_length=max_length)
                
                # Additional check after sanitization to ensure we still have content
                if not data[field]:
                    return Response(
                        {'error': f'{field} cannot be empty after sanitization'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Handle requirements and responsibilities as lists
            for field in ['requirements', 'responsibilities']:
                field_value = data.get(field)
                if not field_value:
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # If the field is a string, convert it to a list
                if isinstance(field_value, str):
                    # Split by newlines or convert to a single-item list depending on format
                    if '\n' in field_value:
                        # Split by newlines and filter out empty lines
                        items = [item.strip() for item in field_value.split('\n') if item.strip()]
                        if not items:  # Ensure we have at least one item
                            items = [field_value.strip()]
                    else:
                        items = [field_value.strip()]
                elif isinstance(field_value, list):
                    items = field_value
                else:
                    return Response(
                        {'error': f'{field} must be a string or a list'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                # Sanitize each item in the list using the sanitize_text method
                sanitized_items = []
                for item in items:
                    # Apply proper sanitization with bleach
                    sanitized_item = self.sanitize_text(item, max_length=1000)  # Set a reasonable max length
                    if sanitized_item:
                        sanitized_items.append(sanitized_item)
                
                if not sanitized_items:  # Ensure we have at least one item after sanitization
                    return Response(
                        {'error': f'{field} must contain at least one non-empty item after sanitization'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                data[field] = sanitized_items
            
            # Let the serializer handle remaining validation
            serializer = JobPostSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                job_post = serializer.save(job_provider=job_provider)
                logger.info(f"New job post created: ID {job_post.id} by provider {job_provider.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            logger.warning(f"Validation error in JobPostView.post for user {request.user.id}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error in JobPostView.post: {str(e)}", exc_info=True)
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
    page_size = settings.PUBLIC_JOB_POST_PAGE_SIZE
    page_size_query_param = settings.PUBLIC_JOB_POST_PAGE_SIZE_QUERY_PARAM
    max_page_size = settings.PUBLIC_JOB_POST_MAX_PAGE_SIZE

class PublicJobPostListView(APIView):
    pagination_class = PublicJobPostPagination
    
    # Hard-coded capital choices from model
    VALID_JOB_TYPES = ['REMOTE', 'HYBRID', 'ONSITE']
    VALID_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'TRAINEE', 'CONTRACT']
    VALID_DOMAINS = ['ACCOUNTING', 'IT', 'MANAGEMENT', 'MARKETING', 'ENGINEERING', 'HEALTHCARE', 'EDUCATION', 'OTHER']

    def sanitize_text(self, text, max_length=None):
        """Sanitize text input to prevent XSS attacks"""
        if text is None:
            return ""
        # Clean the text with bleach to remove potentially harmful HTML
        cleaned_text = bleach.clean(str(text).strip(), strip=True)
        # Apply length limit if specified
        if max_length and len(cleaned_text) > max_length:
            cleaned_text = cleaned_text[:max_length]
        return cleaned_text

    def get(self, request):
        try:
            # Sanitize search parameter
            search = self.sanitize_text(request.query_params.get("search", ""), max_length=100)
            
            # Sanitize location parameter
            location = self.sanitize_text(request.query_params.get("location", ""), max_length=255)
            
            # Validate job_type parameter
            job_type = request.query_params.get("job_type", "").upper()
            if job_type and job_type not in self.VALID_JOB_TYPES:
                return Response(
                    {'error': f"Invalid job_type. Must be one of {self.VALID_JOB_TYPES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate employment_type parameter
            employment_type = request.query_params.get("employment_type", "").upper()
            if employment_type and employment_type not in self.VALID_EMPLOYMENT_TYPES:
                return Response(
                    {'error': f"Invalid employment_type. Must be one of {self.VALID_EMPLOYMENT_TYPES}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate domain parameter
            domain = request.query_params.get("domain", "").upper()
            if domain and domain not in self.VALID_DOMAINS:
                return Response(
                    {'error': f"Invalid domain. Must be one of {self.VALID_DOMAINS}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Base query - only published, non-deleted jobs with future deadline
            jobs = JobPost.objects.filter(
                status="PUBLISHED",
                is_deleted=False,
                application_deadline__gte=timezone.now(),
            )
            
            # Apply text-based filters
            if search:
                jobs = jobs.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search) |
                    Q(job_provider__company_name__icontains=search)
                )
                
            if location:
                jobs = jobs.filter(location__icontains=location)
            
            # Apply validated choice filters
            if job_type:
                jobs = jobs.filter(job_type=job_type)
                
            if employment_type:
                jobs = jobs.filter(employment_type=employment_type)
                
            if domain:
                jobs = jobs.filter(domain=domain)
            
            try:
                # Apply pagination and return results
                paginator = self.pagination_class()
                page = paginator.paginate_queryset(jobs.order_by("-created_at"), request)
                serializer = PublicJobPostSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            except Exception as pagination_error:
                logger.error(f"Pagination error: {str(pagination_error)}")
                return Response(
                    {'error': 'Error occurred during pagination'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Unexpected error in PublicJobPostListView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
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
            answers = request.data.get('answers', [])
            
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
            
            # Check for job questions
            job_questions = JobQuestion.objects.filter(job_post=job)
            
            # If there are questions, validate that all are answered
            if job_questions.exists():
                question_ids = set(q.id for q in job_questions)
                answered_question_ids = set(a.get('question_id') for a in answers if a.get('question_id'))
                
                if question_ids != answered_question_ids:
                    missing_questions = question_ids - answered_question_ids
                    return Response(
                        {"error": f"All job questions must be answered. Missing {len(missing_questions)} required question(s)."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create the application
            application = JobApplication.objects.create(
                jobpost=job,
                job_seeker=job_seeker,
                status="APPLIED"
            )
            
            # Save the answers if there are any questions
            if job_questions.exists():
                for answer_data in answers:
                    question_id = answer_data.get('question_id')
                    answer_text = answer_data.get('answer_text', '')
                    
                    try:
                        question = JobQuestion.objects.get(id=question_id, job_post=job)
                        
                        # For YES_NO questions, validate the answer
                        if question.question_type == 'YES_NO' and answer_text not in ['Yes', 'No']:
                            return Response(
                                {"error": f"Question '{question.question_text}' requires a Yes or No answer."},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        # Create the answer record
                        JobQuestionAnswer.objects.create(
                            question=question,
                            application=application,
                            answer_text=answer_text
                        )
                    except JobQuestion.DoesNotExist:
                        return Response(
                            {"error": f"Invalid question ID: {question_id}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # Send notification to job provider
            send_job_applied_notification(application)
            
            try:
                job_provider = job.job_provider
                company_name = job_provider.company_name
                
                send_mail(
                    subject=f'Application Submitted: {job.title}',
                    message=f'''
Congratulations! Your application for the position of "{job.title}" at {company_name} has been successfully submitted.

Job Details:
- Position: {job.title}
- Company: {company_name}
- Location: {job.location}
- Salary Range: {job.min_salary} - {job.max_salary} 

You can track the status of your application on your Seekerspot dashboard. We wish you the best of luck with your application!

Regards,
The Seekerspot Team
                    ''',
                    from_email=None,
                    recipient_list=[request.user.email],
                    fail_silently=True, 
                )
            except Exception as e:
                print(f"Failed to send application confirmation email: {str(e)}")
            
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
            
            # Simple query without problematic prefetch_related
            applications = JobApplication.objects.filter(jobpost=job_post).select_related(
                'job_seeker__user'
            ).prefetch_related(
                'question_answers__question'
            )
            
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
                    
                # Save the previous status for notification logic
                previous_status = application.status
                
                application.status = status_value
                application.save()
                
                # Send specific emails for SHORTLISTED and HIRED status
                if status_value == 'SHORTLISTED':
                    self.send_shortlisted_email(application)
                elif status_value == 'HIRED':
                    self.send_hired_email(application)
                else:
                    # For other status updates, use the generic notification
                    send_application_status_notification(application)

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
    
    def send_shortlisted_email(self, application):
        """Send email notification when application is shortlisted"""
        job_seeker_name = application.job_seeker.user.get_full_name() or application.job_seeker.user.username
        job_seeker_email = application.job_seeker.user.email
        job_title = application.jobpost.title
        company_name = application.jobpost.job_provider.company_name
        
        send_mail(
            subject=f'Application Shortlisted: {job_title} at {company_name}',
            message=f'''Dear {job_seeker_name},

We are pleased to inform you that your application for the position of "{job_title}" at {company_name} has been shortlisted!

Your application has impressed our hiring team, and you have moved to the next stage of our selection process. We will be in touch soon with further details about the next steps.

We appreciate your interest in joining our team and look forward to the possibility of working with you.

Best regards,
{company_name} Hiring Team
via Seekerspot
            ''',
            from_email=None,
            recipient_list=[job_seeker_email],
            fail_silently=True,
        )
    
    def send_hired_email(self, application):
        """Send congratulations email when application is hired"""
        job_seeker_name = application.job_seeker.user.get_full_name() or application.job_seeker.user.username
        job_seeker_email = application.job_seeker.user.email
        job_title = application.jobpost.title
        company_name = application.jobpost.job_provider.company_name
        
        send_mail(
            subject=f'Congratulations! Job Offer: {job_title} at {company_name}',
            message=f'''Dear {job_seeker_name},

Congratulations! We are thrilled to inform you that you have been selected for the position of "{job_title}" at {company_name}.

Your skills, experience, and enthusiasm have impressed our team, and we are excited to welcome you aboard. Our HR team will be contacting you soon with the formal offer letter and onboarding details.

We look forward to having you as part of our team and are confident that you will make valuable contributions to our organization.

Once again, congratulations on this achievement!

Warm regards,
{company_name} Hiring Team
via Seekerspot
            ''',
            from_email=None,
            recipient_list=[job_seeker_email],
            fail_silently=True,
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
        
class JobQuestionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, job_id):
        try:
            job_post = JobPost.objects.get(id=job_id, is_deleted=False)
            questions = JobQuestion.objects.filter(job_post=job_post)
            serializer = JobQuestionSerializer(questions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job post not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching job questions: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuestionAnswersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, application_id):
        try:
            # Get application and check if user is the job seeker
            application = JobApplication.objects.get(id=application_id)
            
            if not hasattr(request.user, 'job_seeker_profile') or request.user.job_seeker_profile != application.job_seeker:
                return Response(
                    {'error': 'You are not authorized to answer these questions'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Process answers
            answers_data = request.data.get('answers', [])
            
            # Create or update answers
            for answer_data in answers_data:
                question_id = answer_data.get('question')
                answer_text = answer_data.get('answer_text', '')
                
                question = JobQuestion.objects.get(id=question_id, job_post=application.jobpost)
                
                # Create or update answer
                JobQuestionAnswer.objects.update_or_create(
                    question=question,
                    application=application,
                    defaults={'answer_text': answer_text}
                )
            
            return Response(
                {'message': 'Answers submitted successfully'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error submitting answers: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )