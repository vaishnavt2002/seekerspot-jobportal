from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializer import *  
from rest_framework.permissions import IsAuthenticated
from .permissions import IsJobProvier, IsJobSeeker
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser

# Create your views here.
class WorkExperienceListCreateView(APIView):
    permission_classes=[IsAuthenticated, IsJobSeeker]
    def get(self,request):
        job_seeker = request.user.job_seeker_profile
        work_experiences = WorkExperience.objects.filter(job_seeker=job_seeker)
        serializer = WorkExperienceSerializer(work_experiences, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def post(self, request):
        job_seeker = request.user.job_seeker_profile
        serializer = WorkExperienceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(job_seeker=job_seeker)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class WorkExperienceDetailView(APIView):
    permission_classes=[IsAuthenticated, IsJobSeeker]
    def get(self, request, pk):
        job_seeker = request.user.job_seeker_profile
        work_experience = get_object_or_404(WorkExperience, pk=pk, job_seeker=job_seeker)
        serializer = WorkExperienceSerializer(work_experience)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request, pk):
        job_seeker = request.user.job_seeker_profile
        work_experience = get_object_or_404(WorkExperience, pk=pk, job_seeker=job_seeker)
        serializer = WorkExperienceSerializer(work_experience, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk): 
        job_seeker = request.user.job_seeker_profile
        work_experience = get_object_or_404(WorkExperience, pk=pk, job_seeker=job_seeker)
        work_experience.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class EducationListCreateView(APIView):
    permission_classes=[IsAuthenticated, IsJobSeeker]
    def get(self, request):
        job_seeker = request.user.job_seeker_profile
        educations = Education.objects.filter(job_seeker=job_seeker)
        serializer = EducationSerializer(educations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        job_seeker = request.user.job_seeker_profile
        serializer = EducationSerializer(data= request.data)
        if serializer.is_valid():
            serializer.save(job_seeker=job_seeker)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class EducationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    def get(self, request, pk):
        return get_object_or_404(Education,pk=pk, job_seeker=request.user.job_seeker_profile)
    def put(self, request, pk):
        job_seeker = request.user.job_seeker_profile
        education = get_object_or_404(Education, pk=pk, job_seeker=job_seeker)
        serializer = EducationSerializer(education, data= request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status= status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk):
        job_seeker = request.user.job_seeker_profile
        education = get_object_or_404(Education, pk=pk, job_seeker=job_seeker)
        education.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class PersonalDetailsView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        job_seeker = request.user.job_seeker_profile
        serializer = JobSeekerSerializer(job_seeker)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        job_seeker = request.user.job_seeker_profile
        serializer = JobSeekerSerializer(job_seeker, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        """
        Update the user's profile picture.
        """
        user = request.user
        serializer = ProfilePictureSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Remove the user's profile picture.
        """
        user = request.user
        if user.profile_picture:
            user.profile_picture.delete(save=True)
            return Response({"message": "Profile picture removed."}, status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "No profile picture to remove."}, status=status.HTTP_400_BAD_REQUEST)
    
class JobProviderProfileView(APIView):
    permission_classes = [IsAuthenticated, IsJobProvier]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request):
        job_provider = request.user.job_provider_profile
        serializer = JobProviderProfileSerializer(job_provider)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request):
        job_provider = request.user.job_provider_profile
        serializer = JobProviderProfileSerializer(job_provider, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)