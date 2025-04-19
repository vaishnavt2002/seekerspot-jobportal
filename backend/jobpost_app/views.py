from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from profile_app.permissions import IsJobProvier
from .models import JobPost, Skills
from .serializer import JobPostSerializer, PublicJobPostSerializer, SkillSerializer
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone

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