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
from django.core.files.base import ContentFile
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
import logging
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
import mimetypes
import os


logger = logging.getLogger(__name__)


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
        
        if not job_seeker.resume:
            return Response(
                {'error': 'No resume uploaded yet.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Build response data manually since we're storing URL directly
        response_data = {
            'resume': job_seeker.resume,
            'filename': self._extract_filename_from_url(job_seeker.resume),
            'url_download': job_seeker.resume,
            'uploaded_at': job_seeker.updated_at,
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

    def put(self, request):
        job_seeker = request.user.job_seeker_profile

        # Handle file upload
        if 'resume' not in request.FILES:
            return Response(
                {'error': 'No resume file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resume_file = request.FILES['resume']
        
        # Enhanced file validation
        validation_result = self._validate_file(resume_file)
        if not validation_result['valid']:
            return Response(
                {'error': validation_result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Delete old resume if it exists
            if job_seeker.resume:
                self._delete_old_resume(job_seeker.resume)

            # Upload new resume using direct Cloudinary API
            upload_result = self._upload_to_cloudinary(resume_file, request.user.id)
            
            # Store the secure URL in the model
            job_seeker.resume = upload_result['secure_url']
            job_seeker.save()

            # Return success response
            response_data = {
                'resume': upload_result['secure_url'],
                'filename': resume_file.name,
                'url_download': upload_result['secure_url'],
                'uploaded_at': job_seeker.updated_at,
            }
            
            return Response(response_data, status=status.HTTP_200_OK)

        except CloudinaryError as e:
            logger.error(f"Cloudinary upload error: {e}")
            
            # Handle specific error messages
            error_message = str(e).lower()
            if "unsupported" in error_message or "zip" in error_message:
                return Response(
                    {'error': 'File format not supported. Please convert your document to PDF and try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif "size" in error_message:
                return Response(
                    {'error': 'File size too large. Please reduce file size and try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': f'Upload failed: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Resume upload error: {e}")
            return Response(
                {'error': 'Upload failed. Please try again or contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        job_seeker = request.user.job_seeker_profile

        if not job_seeker.resume:
            return Response(
                {'error': 'No resume to delete'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Delete from Cloudinary
            self._delete_old_resume(job_seeker.resume)
            
            # Clear the field
            job_seeker.resume = None
            job_seeker.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Resume deletion error: {e}")
            return Response(
                {'error': 'Failed to delete resume. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _validate_file(self, file):
        """Enhanced file validation"""
        # Check file size (5MB limit)
        max_size = 5 * 1024 * 1024
        if file.size > max_size:
            return {
                'valid': False,
                'error': 'File size exceeds 5MB limit.'
            }

        # Get file extension
        file_name = file.name.lower()
        file_extension = os.path.splitext(file_name)[1]
        
        # Allowed extensions
        allowed_extensions = ['.pdf', '.doc', '.docx']
        if file_extension not in allowed_extensions:
            return {
                'valid': False,
                'error': 'Invalid file type. Please upload a PDF, DOC, or DOCX file.'
            }

        # For PDF files, also check MIME type
        if file_extension == '.pdf':
            if file.content_type != 'application/pdf':
                return {
                    'valid': False,
                    'error': 'Invalid PDF file. Please ensure your file is a valid PDF.'
                }

        return {'valid': True}

    def _upload_to_cloudinary(self, file, user_id):
        """Upload file directly to Cloudinary with proper options"""
        
        # Generate unique public_id
        file_name = os.path.splitext(file.name)[0]  # Remove extension
        file_extension = os.path.splitext(file.name)[1].lower()
        public_id = f"resume_{user_id}_{file_name}"
        
        # Upload options based on file type
        upload_options = {
            'resource_type': 'raw',  # Always use 'raw' for documents
            'folder': 'resumes',
            'public_id': public_id,
            'overwrite': True,
            'use_filename': True,
            'unique_filename': False,
        }
        
        # Special handling for different file types
        if file.name.lower().endswith('.pdf'):
            upload_options['format'] = 'pdf'
        elif file.name.lower().endswith('.docx'):
            upload_options['format'] = 'docx'
        elif file.name.lower().endswith('.doc'):
            upload_options['format'] = 'doc'

        return cloudinary.uploader.upload(file, **upload_options)

    def _delete_old_resume(self, resume_url):
        """Delete old resume from Cloudinary"""
        try:
            # Extract public_id from URL
            public_id = self._extract_public_id_from_url(resume_url)
            if public_id:
                cloudinary.uploader.destroy(public_id, resource_type="raw")
        except Exception as e:
            logger.warning(f"Failed to delete old resume: {e}")

    def _extract_public_id_from_url(self, url):
        """Extract public_id from Cloudinary URL"""
        try:
            # Cloudinary URL format: 
            # https://res.cloudinary.com/cloud_name/raw/upload/v123456/folder/public_id.ext
            if 'cloudinary.com' in url:
                parts = url.split('/')
                # Find the upload part and get everything after it
                upload_index = parts.index('upload')
                if upload_index + 2 < len(parts):
                    # Skip version number (v123456)
                    public_id_with_ext = '/'.join(parts[upload_index + 2:])
                    # Remove file extension
                    public_id = os.path.splitext(public_id_with_ext)[0]
                    return public_id
        except Exception as e:
            logger.warning(f"Error extracting public_id from URL: {e}")
        return None

    def _extract_filename_from_url(self, url):
        """Extract filename from URL"""
        try:
            if url:
                return os.path.basename(url).split('?')[0]  # Remove query parameters
        except:
            pass
        return "resume.pdf"