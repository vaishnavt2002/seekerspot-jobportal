from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
import bleach
from auth_app.models import User, JobSeeker, JobProvider
from .serializer import JobSeekerAdminSerializer, JobProviderAdminSerializer
import logging
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


#job seeker admin view
class JobSeekerAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def sanitize_text(self, text, max_length=None):
        """Sanitize text input to prevent XSS attacks"""
        if text is None:
            return ""
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
                
                page_size = request.query_params.get('page_size', '10')
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
            
            # Status filter
            status_param = request.query_params.get('status', '').lower()
            if status_param in ['active', 'blocked']:
                filter_params['user__is_active'] = (status_param == 'active')
            elif status_param:
                return Response(
                    {'error': "Invalid status. Must be one of ['active', 'blocked']"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Verification filter
            verification_param = request.query_params.get('verified', '').lower()
            if verification_param in ['true', 'false']:
                filter_params['user__is_verified'] = (verification_param == 'true')
            elif verification_param:
                return Response(
                    {'error': "Invalid verified status. Must be one of ['true', 'false']"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Experience filter
            try:
                min_experience = request.query_params.get('min_experience', '')
                if min_experience:
                    min_experience = int(min_experience)
                    if min_experience < 0:
                        return Response(
                            {'error': 'Minimum experience cannot be negative'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    filter_params['experience__gte'] = min_experience
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
                    filter_params['experience__lte'] = max_experience
            except ValueError:
                return Response(
                    {'error': 'Maximum experience must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Build query with validated parameters
            job_seekers = JobSeeker.objects.filter(**filter_params).select_related('user')
            
            # Apply search filter if provided
            if search:
                job_seekers = job_seekers.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(summary__icontains=search)
                )
            
            # Apply sort
            sort = request.query_params.get('sort', '-created_at')
            valid_sorts = ['created_at', '-created_at', 'user__email', '-user__email']
            if sort not in valid_sorts:
                return Response(
                    {'error': f"Invalid sort parameter. Must be one of {valid_sorts}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job_seekers = job_seekers.order_by(sort)
            
            # Pagination
            paginator = Paginator(job_seekers, page_size)
            try:
                paginated_job_seekers = paginator.page(page)
            except EmptyPage:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize and return response
            serializer = JobSeekerAdminSerializer(paginated_job_seekers, many=True)
            return Response({
                'results': serializer.data,
                'next': None if not paginated_job_seekers.has_next() else page + 1,
                'previous': None if not paginated_job_seekers.has_previous() else page - 1,
                'count': paginator.count,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Unexpected error in JobSeekerAdminView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, pk):
        try:
            job_seeker = JobSeeker.objects.get(pk=pk)
            serializer = JobSeekerAdminSerializer(job_seeker, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Job seeker updated: ID {pk} by admin {request.user.id}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobSeeker.DoesNotExist:
            return Response(
                {'error': 'Job seeker not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobSeekerAdminView.patch: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class JobSeekerBlockView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, pk):
        try:
            job_seeker = JobSeeker.objects.get(pk=pk)
            user = job_seeker.user
            is_active = request.data.get('is_active')
            if is_active is None:
                return Response(
                    {'error': 'is_active field is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.is_active = is_active
            user.save()
            logger.info(f"Job seeker {pk} {'unblocked' if is_active else 'blocked'} by admin {request.user.id}")
            return Response(
                {'message': f"Job seeker {'unblocked' if is_active else 'blocked'} successfully"},
                status=status.HTTP_200_OK
            )
        except JobSeeker.DoesNotExist:
            return Response(
                {'error': 'Job seeker not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobSeekerBlockView.patch: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

#job provider admin view

class JobProviderAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def sanitize_text(self, text, max_length=None):
        """Sanitize text input to prevent XSS attacks"""
        if text is None:
            return ""
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
                
                page_size = request.query_params.get('page_size', '10')
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
            
            # Status filter
            status_param = request.query_params.get('status', '').lower()
            if status_param in ['active', 'blocked']:
                filter_params['user__is_active'] = (status_param == 'active')
            elif status_param:
                return Response(
                    {'error': "Invalid status. Must be one of ['active', 'blocked']"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Verification filter
            verification_param = request.query_params.get('verified', '').lower()
            if verification_param in ['true', 'false']:
                filter_params['is_verified'] = (verification_param == 'true')
            elif verification_param:
                return Response(
                    {'error': "Invalid verified status. Must be one of ['true', 'false']"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Industry filter
            industry = self.sanitize_text(request.query_params.get('industry', ''), max_length=100)
            if industry:
                filter_params['industry__icontains'] = industry
            
            # Build query with validated parameters
            job_providers = JobProvider.objects.filter(**filter_params).select_related('user')
            
            # Apply search filter if provided
            if search:
                job_providers = job_providers.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(company_name__icontains=search) |
                    Q(description__icontains=search)
                )
            
            # Apply sort
            sort = request.query_params.get('sort', '-created_at')
            valid_sorts = ['created_at', '-created_at', 'user__email', '-user__email', 'company_name', '-company_name']
            if sort not in valid_sorts:
                return Response(
                    {'error': f"Invalid sort parameter. Must be one of {valid_sorts}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job_providers = job_providers.order_by(sort)
            
            # Pagination
            paginator = Paginator(job_providers, page_size)
            try:
                paginated_job_providers = paginator.page(page)
            except EmptyPage:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize and return response
            serializer = JobProviderAdminSerializer(paginated_job_providers, many=True)
            return Response({
                'results': serializer.data,
                'next': None if not paginated_job_providers.has_next() else page + 1,
                'previous': None if not paginated_job_providers.has_previous() else page - 1,
                'count': paginator.count,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Unexpected error in JobProviderAdminView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(pk=pk)
            serializer = JobProviderAdminSerializer(job_provider, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Job provider updated: ID {pk} by admin {request.user.id}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobProviderAdminView.patch: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class JobProviderBlockView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(pk=pk)
            user = job_provider.user
            is_active = request.data.get('is_active')
            if is_active is None:
                return Response(
                    {'error': 'is_active field is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.is_active = is_active
            user.save()
            logger.info(f"Job provider {pk} {'unblocked' if is_active else 'blocked'} by admin {request.user.id}")
            return Response(
                {'message': f"Job provider {'unblocked' if is_active else 'blocked'} successfully"},
                status=status.HTTP_200_OK
            )
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobProviderBlockView.patch: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class JobProviderVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, pk):
        try:
            job_provider = JobProvider.objects.get(pk=pk)
            user = job_provider.user
            
            # Set verification status to true
            job_provider.is_verified = True
            job_provider.save()
            try:
                send_mail(
                    subject='Seekerspot Account Verification Successful',
                    message='Congratulations! Your Seekerspot job provider account has been verified successfully. '
                            'You can now log in to your account and start using our services.',
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                logger.info(f"Verification email sent to job provider {pk}")
            except Exception as e:
                # Log the error but don't fail the verification process
                logger.error(f"Failed to send verification email to job provider {pk}: {str(e)}")
            
            logger.info(f"Job provider {pk} verified by admin {request.user.id}")
            return Response(
                {'message': "Job provider verified successfully"},
                status=status.HTTP_200_OK
            )
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobProviderVerifyView.patch: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )