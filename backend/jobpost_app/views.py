from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from profile_app.permissions import IsJobProvier
from .models import JobPost, Skills, JobApplication
from .serializer import JobPostSerializer, PublicJobPostSerializer, SkillSerializer,JobApplicationSerializer
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from auth_app.models import JobSeeker
from profile_app.models import JobSeekerSkill

class JobPostView(APIView):
    permission_classes = [IsAuthenticated, IsJobProvier]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        job_posts = JobPost.objects.filter(job_provider=request.user.job_provider_profile, is_deleted=False)
        serializer = JobPostSerializer(job_posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = JobPostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(job_provider=request.user.job_provider_profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        """Get all skills of the logged-in job seeker"""
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            # Get all skills associated with this job seeker
            job_seeker_skills = JobSeekerSkill.objects.filter(job_seeker=job_seeker)
            skills = [js_skill.skill for js_skill in job_seeker_skills]
            
            serializer = SkillSerializer(skills, many=True)
            
            # Log for debugging
            print(f"User {request.user.username} has {len(skills)} skills")
            print(f"Skills: {', '.join([skill.name for skill in skills])}")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except JobSeeker.DoesNotExist:
            # Return empty list if job seeker doesn't exist
            print(f"JobSeeker profile not found for user {request.user.username}")
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            # Log any other exception
            print(f"Error in JobSeekerSkillsView: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

class AddSkillsToProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Add skills to job seeker profile"""
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
            
            # Return all updated skills
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
        """Apply for a job"""
        try:
            job_seeker = JobSeeker.objects.get(user=request.user)
            job_id = request.data.get('jobpost_id')
            
            if not job_id:
                return Response(
                    {"error": "jobpost_id is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if job exists and is valid
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
            
            # Check if already applied
            if JobApplication.objects.filter(jobpost=job, job_seeker=job_seeker).exists():
                return Response(
                    {"error": "You have already applied for this job."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create application
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
                {"error": "Job seeker profile not found. Please complete your profile before applying."},
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
                # Return a properly formatted response
                return Response(
                    {"status": "NOT_APPLIED", "message": "You have not applied for this job yet."},
                    status=status.HTTP_200_OK
                )
        except JobSeeker.DoesNotExist:
            return Response(
                {"error": "Job seeker profile not found.", "status": "ERROR"},
                status=status.HTTP_404_NOT_FOUND
            )