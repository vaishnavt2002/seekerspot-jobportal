from django.db.models import Count, Sum, F, Q, Avg
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from datetime import datetime, timedelta
from auth_app.models import User, JobSeeker, JobProvider
from jobpost_app.models import *
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
            
            # Get user growth data - for each time period (day/week/month)
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
            
            # Get cumulative growth (running total by date)
            def get_cumulative_data(data):
                cumulative_data = []
                running_total = 0
                for entry in data:
                    running_total += entry['count']
                    cumulative_data.append({
                        'date': entry['period'].strftime('%Y-%m-%d'),
                        'count': running_total
                    })
                return cumulative_data
            
            # Format data for the frontend
            all_users_data = get_cumulative_data(all_users)
            job_seekers_data = get_cumulative_data(job_seekers)
            job_providers_data = get_cumulative_data(job_providers)
            
            # Fill in gaps in the data (days, weeks, or months with no new users)
            def fill_date_gaps(data, interval):
                if not data:
                    return []
                
                filled_data = []
                date_format = '%Y-%m-%d'
                
                # Determine the date increment based on interval
                if interval == 'day':
                    delta = timedelta(days=1)
                elif interval == 'week':
                    delta = timedelta(weeks=1)
                else:
                    # For monthly, we need to handle month increments differently
                    return data  # For simplicity, we'll skip filling for monthly
                
                # Convert all dates to datetime objects
                date_dict = {datetime.strptime(item['date'], date_format): item['count'] for item in data}
                
                # Get start and end dates
                start_date = min(date_dict.keys())
                end_date = max(date_dict.keys())
                
                # Fill in missing dates
                current_date = start_date
                while current_date <= end_date:
                    current_str = current_date.strftime(date_format)
                    if current_date in date_dict:
                        filled_data.append({'date': current_str, 'count': date_dict[current_date]})
                    else:
                        # Use previous count if available
                        prev_count = filled_data[-1]['count'] if filled_data else 0
                        filled_data.append({'date': current_str, 'count': prev_count})
                    
                    current_date += delta
                
                return filled_data
            
            all_users_data = fill_date_gaps(all_users_data, interval)
            job_seekers_data = fill_date_gaps(job_seekers_data, interval)
            job_providers_data = fill_date_gaps(job_providers_data, interval)
            
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

class AdminApplicationAnalyticsView(APIView):
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

#job provider analytics



class IsJobProvider:
    """
    Custom permission to only allow job providers to access the view.
    """
    def has_permission(self, request, view):
        return request.user.user_type == 'job_provider'

class JobProviderStatsView(APIView):
    """API view for job provider dashboard statistics"""
    permission_classes = [IsAuthenticated, IsJobProvider]
    
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
            
            # Get the job provider for the current user
            job_provider = JobProvider.objects.get(user=request.user)
            
            # Overall stats
            total_job_posts = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            ).count()
            
            active_job_posts = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False,
                status='PUBLISHED'
            ).count()
            
            total_applications = JobApplication.objects.filter(
                jobpost__job_provider=job_provider
            ).count()
            
            total_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider
            ).count()
            
            # Recent stats (within the specified period)
            new_job_posts = JobPost.objects.filter(
                job_provider=job_provider,
                created_at__gte=time_threshold,
                is_deleted=False
            ).count()
            
            new_applications = JobApplication.objects.filter(
                jobpost__job_provider=job_provider,
                applied_at__gte=time_threshold
            ).count()
            
            new_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider,
                created_at__gte=time_threshold
            ).count()
            
            # Growth percentages
            # Calculate safely to avoid division by zero
            def calculate_growth(total, new):
                if total - new == 0:
                    return 100.0  # If all are new, growth is 100%
                return round((new / (total - new)) * 100, 2) if total - new > 0 else 0
                
            job_post_growth = calculate_growth(total_job_posts, new_job_posts)
            application_growth = calculate_growth(total_applications, new_applications)
            interview_growth = calculate_growth(total_interviews, new_interviews)
            
            # Application status distribution for this job provider
            application_status = JobApplication.objects.filter(
                jobpost__job_provider=job_provider
            ).values('status').annotate(
                count=Count('id')
            ).order_by('status')
            
            # Job post status distribution
            job_post_status = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            ).values('status').annotate(
                count=Count('id')
            ).order_by('status')
            
            # Job post by domain distribution
            job_post_domain = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            ).values('domain').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Total views/impressions (placeholder - this would require tracking these metrics)
            total_views = 0  # This would require a JobPostView model to track
            
            # Conversion rate (applications per job post)
            applications_per_job = round(total_applications / total_job_posts, 2) if total_job_posts > 0 else 0
            
            # Return all stats
            return Response({
                'total_stats': {
                    'job_posts': total_job_posts,
                    'active_job_posts': active_job_posts,
                    'applications': total_applications,
                    'interviews': total_interviews,
                    'views': total_views,
                },
                'growth': {
                    'job_posts': job_post_growth,
                    'applications': application_growth,
                    'interviews': interview_growth,
                },
                'conversions': {
                    'applications_per_job': applications_per_job,
                },
                'distributions': {
                    'application_status': application_status,
                    'job_post_status': job_post_status,
                    'job_post_domain': job_post_domain
                }
            }, status=status.HTTP_200_OK)
            
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobProviderStatsView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class JobPostActivityView(APIView):
    """API view for job post activity over time"""
    permission_classes = [IsAuthenticated, IsJobProvider]
    
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
            
            # Get the job provider for the current user
            job_provider = JobProvider.objects.get(user=request.user)
            
            # Select the appropriate truncation function based on interval
            if interval == 'week':
                trunc_func = TruncWeek
            elif interval == 'day':
                trunc_func = TruncDay
            else:  # Default to month
                trunc_func = TruncMonth
            
            # Get job posts created over time
            job_posts_over_time = JobPost.objects.filter(
                job_provider=job_provider,
                created_at__gte=time_threshold,
                is_deleted=False
            ).annotate(
                period=trunc_func('created_at')
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')
            
            # Get applications over time
            applications_over_time = JobApplication.objects.filter(
                jobpost__job_provider=job_provider,
                applied_at__gte=time_threshold
            ).annotate(
                period=trunc_func('applied_at')
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')
            
            # Format data for the frontend
            posts_over_time_data = [{'date': entry['period'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in job_posts_over_time]
            applications_over_time_data = [{'date': entry['period'].strftime('%Y-%m-%d'), 'count': entry['count']} for entry in applications_over_time]
            
            # Job posts by type (remote, hybrid, onsite)
            job_posts_by_type = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            ).values('job_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Job posts by employment type
            job_posts_by_employment = JobPost.objects.filter(
                job_provider=job_provider,
                is_deleted=False
            ).values('employment_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            return Response({
                'job_posts_over_time': posts_over_time_data,
                'applications_over_time': applications_over_time_data,
                'job_posts_by_type': job_posts_by_type,
                'job_posts_by_employment': job_posts_by_employment,
                'interval': interval
            }, status=status.HTTP_200_OK)
            
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in JobPostActivityView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ApplicationAnalyticsView(APIView):
    """API view for job application analytics for a specific job provider"""
    permission_classes = [IsAuthenticated, IsJobProvider]
    
    def get(self, request):
        try:
            # Get the job provider for the current user
            job_provider = JobProvider.objects.get(user=request.user)
            
            # Get top performing job posts (most applications)
            top_job_posts = JobApplication.objects.filter(
                jobpost__job_provider=job_provider
            ).values(
                'jobpost'
            ).annotate(
                count=Count('id'),
                job_title=F('jobpost__title')
            ).order_by('-count')[:10]
            
            # Get conversion rates (applied -> hired)
            total_applications = JobApplication.objects.filter(
                jobpost__job_provider=job_provider
            ).count()
            
            hired_count = JobApplication.objects.filter(
                jobpost__job_provider=job_provider,
                status='HIRED'
            ).count()
            
            shortlisted_count = JobApplication.objects.filter(
                jobpost__job_provider=job_provider,
                status='SHORTLISTED'
            ).count()
            
            rejected_count = JobApplication.objects.filter(
                jobpost__job_provider=job_provider,
                status='REJECTED'
            ).count()
            
            # Calculate rates
            conversion_rate = (hired_count / total_applications * 100) if total_applications > 0 else 0
            shortlisted_rate = (shortlisted_count / total_applications * 100) if total_applications > 0 else 0
            rejection_rate = (rejected_count / total_applications * 100) if total_applications > 0 else 0
            
            # Get applications by status
            applications_by_status = JobApplication.objects.filter(
                jobpost__job_provider=job_provider
            ).values(
                'status'
            ).annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get pending applications (those that need review)
            pending_applications = JobApplication.objects.filter(
                jobpost__job_provider=job_provider,
                status='APPLIED'
            ).count()
            
            # Get upcoming interviews
            upcoming_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider,
                interview_date__gte=datetime.now().date(),
                status='SCHEDULED'
            ).count()
            
            # Get average time to hire (placeholder - would need more data tracking)
            # This would require tracking when status changes from APPLIED to HIRED
            avg_time_to_hire = "N/A"  # Placeholder
            
            return Response({
                'top_job_posts': top_job_posts,
                'conversion_rate': round(conversion_rate, 2),
                'shortlisted_rate': round(shortlisted_rate, 2),
                'rejection_rate': round(rejection_rate, 2),
                'total_applications': total_applications,
                'hired_count': hired_count,
                'shortlisted_count': shortlisted_count,
                'rejection_count': rejected_count,
                'pending_applications': pending_applications,
                'upcoming_interviews': upcoming_interviews,
                'avg_time_to_hire': avg_time_to_hire,
                'applications_by_status': applications_by_status
            }, status=status.HTTP_200_OK)
            
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in ApplicationAnalyticsView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpcomingInterviewsView(APIView):
    """API view for upcoming interviews for a job provider"""
    permission_classes = [IsAuthenticated, IsJobProvider]
    
    def get(self, request):
        try:
            # Get the job provider for the current user
            job_provider = JobProvider.objects.get(user=request.user)
            
            # Get upcoming interviews
            upcoming_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider,
                interview_date__gte=datetime.now().date(),
                status='SCHEDULED'
            ).select_related(
                'application',
                'application__job_seeker',
                'application__job_seeker__user',
                'application__jobpost'
            ).order_by('interview_date', 'interview_time')[:10]
            
            # Format for frontend
            interview_data = []
            for interview in upcoming_interviews:
                interview_data.append({
                    'id': interview.id,
                    'job_title': interview.application.jobpost.title,
                    'candidate_name': f"{interview.application.job_seeker.user.first_name} {interview.application.job_seeker.user.last_name}",
                    'interview_date': interview.interview_date.strftime('%Y-%m-%d'),
                    'interview_time': interview.interview_time.strftime('%H:%M'),
                    'interview_type': interview.interview_type,
                    'meeting_id': interview.meeting_id,
                })
            
            # Get interview statistics
            total_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider
            ).count()
            
            completed_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider,
                status='COMPLETED'
            ).count()
            
            cancelled_interviews = InterviewSchedule.objects.filter(
                application__jobpost__job_provider=job_provider,
                status='CANCELLED'
            ).count()
            
            return Response({
                'upcoming_interviews': interview_data,
                'interview_stats': {
                    'total': total_interviews,
                    'completed': completed_interviews,
                    'cancelled': cancelled_interviews,
                    'scheduled': total_interviews - completed_interviews - cancelled_interviews
                }
            }, status=status.HTTP_200_OK)
            
        except JobProvider.DoesNotExist:
            return Response(
                {'error': 'Job provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error in UpcomingInterviewsView.get: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )