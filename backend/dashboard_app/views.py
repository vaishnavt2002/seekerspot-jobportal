from django.db.models import Count, Sum, F, Q, Avg
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from datetime import datetime, timedelta
from auth_app.models import User, JobSeeker, JobProvider
from jobpost_app.models import JobPost, JobApplication
from interview_app.models import InterviewSchedule
import logging

logger = logging.getLogger(__name__)

class AdminDashboardStatsView(APIView):
    """API view for admin dashboard statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        try:
            # Get time period from query params (default: last 30 days)
            period = request.query_params.get('period', '30')
            
            try:
                days = int(period)
                if days <= 0 or days > 365:
                    return Response(
                        {'error': 'Period must be between 1 and 365 days'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Period must be a valid integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            time_threshold = datetime.now() - timedelta(days=days)
            
            # Overall stats
            total_users = User.objects.count()
            total_job_seekers = JobSeeker.objects.count()
            total_job_providers = JobProvider.objects.count()
            total_job_posts = JobPost.objects.filter(is_deleted=False).count()
            total_job_applications = JobApplication.objects.count()
            total_interviews = InterviewSchedule.objects.count()
            
            # Recent stats (within the specified period)
            new_users = User.objects.filter(created_at__gte=time_threshold).count()
            new_job_seekers = JobSeeker.objects.filter(created_at__gte=time_threshold).count()
            new_job_providers = JobProvider.objects.filter(created_at__gte=time_threshold).count()
            new_job_posts = JobPost.objects.filter(created_at__gte=time_threshold, is_deleted=False).count()
            new_job_applications = JobApplication.objects.filter(applied_at__gte=time_threshold).count()
            new_interviews = InterviewSchedule.objects.filter(created_at__gte=time_threshold).count()
            
            # Growth percentages
            # Calculate safely to avoid division by zero
            def calculate_growth(total, new):
                if total - new == 0:
                    return 100.0  # If all are new, growth is 100%
                return round((new / (total - new)) * 100, 2) if total - new > 0 else 0
                
            user_growth = calculate_growth(total_users, new_users)
            job_seeker_growth = calculate_growth(total_job_seekers, new_job_seekers)
            job_provider_growth = calculate_growth(total_job_providers, new_job_providers)
            job_post_growth = calculate_growth(total_job_posts, new_job_posts)
            application_growth = calculate_growth(total_job_applications, new_job_applications)
            interview_growth = calculate_growth(total_interviews, new_interviews)
            
            # Application status distribution
            application_status = JobApplication.objects.values('status').annotate(
                count=Count('id')
            ).order_by('status')
            
            # Job post status distribution
            job_post_status = JobPost.objects.filter(
                is_deleted=False
            ).values('status').annotate(
                count=Count('id')
            ).order_by('status')
            
            # Job post domain distribution
            job_post_domain = JobPost.objects.filter(
                is_deleted=False
            ).values('domain').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Return all stats
            return Response({
                'total_stats': {
                    'users': total_users,
                    'job_seekers': total_job_seekers,
                    'job_providers': total_job_providers,
                    'job_posts': total_job_posts,
                    'applications': total_job_applications,
                    'interviews': total_interviews,
                },
                'growth': {
                    'users': user_growth,
                    'job_seekers': job_seeker_growth,
                    'job_providers': job_provider_growth,
                    'job_posts': job_post_growth,
                    'applications': application_growth,
                    'interviews': interview_growth,
                },
                'distributions': {
                    'application_status': application_status,
                    'job_post_status': job_post_status,
                    'job_post_domain': job_post_domain
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error in AdminDashboardStatsView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserGrowthView(APIView):
    """API view for user growth data over time"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        try:
            # Get time range and interval from query params
            interval = request.query_params.get('interval', 'month')
            months = request.query_params.get('months', '12')
            
            try:
                months_int = int(months)
                if months_int <= 0 or months_int > 60:
                    return Response(
                        {'error': 'Months must be between 1 and 60'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Months must be a valid integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            time_threshold = datetime.now() - timedelta(days=30 * months_int)
            
            # Select the appropriate truncation function based on interval
            if interval == 'week':
                trunc_func = TruncWeek
            elif interval == 'day':
                trunc_func = TruncDay
            else:  # Default to month
                trunc_func = TruncMonth
            
            # Get user growth data
            all_users = User.objects.filter(
                created_at__gte=time_threshold
            ).annotate(
                period=trunc_func('created_at')
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')
            
            job_seekers = User.objects.filter(
                created_at__gte=time_threshold,
                user_type='job_seeker'
            ).annotate(
                period=trunc_func('created_at')
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')
            
            job_providers = User.objects.filter(
                created_at__gte=time_threshold,
                user_type='job_provider'
            ).annotate(
                period=trunc_func('created_at')
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')
            
            # Format data for the frontend
            all_users_data = [{'date': entry['period'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in all_users]
            job_seekers_data = [{'date': entry['period'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in job_seekers]
            job_providers_data = [{'date': entry['period'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in job_providers]
            
            return Response({
                'all_users': all_users_data,
                'job_seekers': job_seekers_data,
                'job_providers': job_providers_data,
                'interval': interval
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error in UserGrowthView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class JobPostAnalyticsView(APIView):
    """API view for job post analytics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        try:
            # Get time range from query params
            months = request.query_params.get('months', '12')
            
            try:
                months_int = int(months)
                if months_int <= 0 or months_int > 60:
                    return Response(
                        {'error': 'Months must be between 1 and 60'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Months must be a valid integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            time_threshold = datetime.now() - timedelta(days=30 * months_int)
            
            # Get job posts over time
            job_posts_over_time = JobPost.objects.filter(
                created_at__gte=time_threshold,
                is_deleted=False
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')
            
            # Get job posts by domain
            job_posts_by_domain = JobPost.objects.filter(
                is_deleted=False
            ).values('domain').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get job posts by job type (remote, hybrid, onsite)
            job_posts_by_type = JobPost.objects.filter(
                is_deleted=False
            ).values('job_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get job posts by employment type
            job_posts_by_employment = JobPost.objects.filter(
                is_deleted=False
            ).values('employment_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Format data for the frontend
            posts_over_time_data = [{'date': entry['month'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in job_posts_over_time]
            
            return Response({
                'job_posts_over_time': posts_over_time_data,
                'job_posts_by_domain': job_posts_by_domain,
                'job_posts_by_type': job_posts_by_type,
                'job_posts_by_employment': job_posts_by_employment
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error in JobPostAnalyticsView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ApplicationAnalyticsView(APIView):
    """API view for job application analytics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        try:
            # Get time range from query params
            months = request.query_params.get('months', '12')
            
            try:
                months_int = int(months)
                if months_int <= 0 or months_int > 60:
                    return Response(
                        {'error': 'Months must be between 1 and 60'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Months must be a valid integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            time_threshold = datetime.now() - timedelta(days=30 * months_int)
            
            # Get applications over time
            applications_over_time = JobApplication.objects.filter(
                applied_at__gte=time_threshold
            ).annotate(
                month=TruncMonth('applied_at')
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')
            
            # Get applications by status
            applications_by_status = JobApplication.objects.values(
                'status'
            ).annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get applications per job post (top 10 most applied to)
            top_job_posts = JobApplication.objects.values(
                'jobpost'
            ).annotate(
                count=Count('id'),
                job_title=F('jobpost__title')
            ).order_by('-count')[:10]
            
            # Get conversion rates (applied -> hired)
            total_applications = JobApplication.objects.count()
            hired_count = JobApplication.objects.filter(status='HIRED').count()
            rejection_count = JobApplication.objects.filter(status='REJECTED').count()
            
            conversion_rate = (hired_count / total_applications * 100) if total_applications > 0 else 0
            rejection_rate = (rejection_count / total_applications * 100) if total_applications > 0 else 0
            
            # Format data for the frontend
            applications_over_time_data = [{'date': entry['month'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in applications_over_time]
            
            return Response({
                'applications_over_time': applications_over_time_data,
                'applications_by_status': applications_by_status,
                'top_job_posts': top_job_posts,
                'conversion_rate': round(conversion_rate, 2),
                'rejection_rate': round(rejection_rate, 2),
                'total_applications': total_applications,
                'hired_count': hired_count,
                'rejection_count': rejection_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error in ApplicationAnalyticsView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )