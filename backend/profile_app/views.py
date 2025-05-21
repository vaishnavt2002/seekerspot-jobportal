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
    
# views.py
class ProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        serializer = ProfilePictureSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        if user.profile_picture:
            # Set to None rather than calling delete method
            user.profile_picture = None
            user.save()
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
    
class SkillSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("query", "")
        job_seeker = request.user.job_seeker_profile
        # Exclude skills already associated with the job seeker
        existing_skill_ids = JobSeekerSkill.objects.filter(job_seeker=job_seeker).values_list('skill_id', flat=True)
        skills = Skills.objects.filter(name__icontains=query).exclude(id__in=existing_skill_ids)[:10]
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class JobSeekerSkillView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        job_seeker = request.user.job_seeker_profile
        skills = JobSeekerSkill.objects.filter(job_seeker=job_seeker)
        serializer = JobSeekerSkillSerializer(skills, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        job_seeker = request.user.job_seeker_profile
        serializer = JobSeekerSkillSerializer(data=request.data, context={'request': request, 'job_seeker': job_seeker})
        if serializer.is_valid():
            instances = serializer.save()
            if isinstance(instances, list):
                # Bulk addition
                return Response(JobSeekerSkillSerializer(instances, many=True).data, status=status.HTTP_201_CREATED)
            else:
                # Single addition
                return Response(JobSeekerSkillSerializer(instances).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobSeekerSkillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, skill_id):
        job_seeker = request.user.job_seeker_profile
        try:
            job_seeker_skill = JobSeekerSkill.objects.get(job_seeker=job_seeker, skill_id=skill_id)
            job_seeker_skill.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except JobSeekerSkill.DoesNotExist:
            return Response({"error": "Skill not found in your profile."}, status=status.HTTP_404_NOT_FOUND)
        
class SavedJobPostView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    def get(self, request):
        job_seeker = request.user.job_seeker_profile
        saved_jobs = SavedJob.objects.filter(job_seeker=job_seeker)
        serializer = SavedJobSerializer(saved_jobs, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def delete(self, request, job_id):
        job_seeker = request.user.job_seeker_profile
        try:
            saved_job = SavedJob.objects.get(job_seeker=job_seeker, jobpost_id=job_id)
            saved_job.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedJob.DoesNotExist:
            return Response({"error": "Saved job not found."}, status=status.HTTP_404_NOT_FOUND)
        
class ResumeView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    
    def get(self, request):
        job_seeker = request.user.job_seeker_profile
        serializer = ResumeSerializer(job_seeker, context={'request': request})
        
        if not job_seeker.resume:
            return Response(
                {'detail': 'No resume uploaded yet.'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        job_seeker = request.user.job_seeker_profile
        
        # Handle file upload
        if 'resume' not in request.FILES:
            return Response(
                {'error': 'No resume file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check file type
        resume_file = request.FILES['resume']
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
        content_type = resume_file.content_type
        
        if content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Please upload a PDF, DOCX, or DOC file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check file size (limit to 5MB)
        if resume_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File size exceeds 5MB limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Save the file
        job_seeker.resume = resume_file
        job_seeker.save()
        
        serializer = ResumeSerializer(job_seeker, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request):
        job_seeker = request.user.job_seeker_profile
        
        if not job_seeker.resume:
            return Response(
                {'error': 'No resume to delete'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Delete the resume
        job_seeker.resume = None
        job_seeker.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)