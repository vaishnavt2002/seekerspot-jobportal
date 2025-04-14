from ast import Delete, Mult
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from auth_app import serializer
from profile_app.permissions import IsJobProvier
from .models import JobPost
from .serializer import JobPostSerializer

# Create your views here.
class JobPostView(APIView):
    permission_classes = [IsAuthenticated, IsJobProvier]
    parser_classes = [MultiPartParser, FormParser,JSONParser]
    def get(self, request):
        job_posts = JobPost.objects.filter(job_provider=request.user.job_provider_profile,is_deleted=False)
        serializer = JobPostSerializer(job_posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = JobPostSerializer(data=request.data,context={'request': request})
        if serializer.is_valid():
            serializer.save(job_provider=request.user.job_provider_profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class JobPostDetailView(APIView):
    permission_classes = [IsAuthenticated, IsJobProvier]
    parser_classes = [MultiPartParser, FormParser,JSONParser]

    def get_object(self, pk, job_provider):
        try:
            return JobPost.objects.get(pk=pk, job_provider=job_provider,is_deleted=False)
        except JobPost.DoesNotExist:
            return None
    def get(self, request, pk):
        job_post = self.get_object(pk,request.user.job_provider_profile)
        if job_post is None:
            return Response({"error": "Job post not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobPostSerializer(job_post)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        job_post = self.get_object(pk,request.user.job_provider_profile)
        if job_post is None:
            return Response({"error": "Job post not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobPostSerializer(job_post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        job_post = self.get_object(pk,request.user.job_provider_profile)
        if job_post is None:
            return Response({"error": "Job post not found."}, status=status.HTTP_404_NOT_FOUND)
        job_post.delete()
        return Response({"message": "Job post marked as deleted."}, status=status.HTTP_200_OK)

