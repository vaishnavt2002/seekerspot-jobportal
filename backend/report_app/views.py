from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from auth_app.models import User, JobSeeker, JobProvider
from jobpost_app.models import JobPost, JobApplication, Skills
from interview_app.models import InterviewSchedule
from report_app.serializer import (  # Note: Changed from serializer to serializers
    JobPostReportSerializer, 
    UserReportSerializer, 
    ApplicationReportSerializer,
    InterviewReportSerializer
)
from django.db.models import Count, Avg, Sum, Q, F
from django.db.models.functions import ExtractMonth

class BaseReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_time_filter(self, request, timestamp_field='created_at'):
        time_period = request.query_params.get('time_period', 'all')
        
        if time_period == 'all':
            return Q()
        
        now = timezone.now()
        if time_period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            return Q(**{f'{timestamp_field}__gte': start_date})
        elif time_period == 'week':
            start_date = now - timedelta(days=7)
            return Q(**{f'{timestamp_field}__gte': start_date})
        elif time_period == 'month':
            start_date = now - timedelta(days=30)
            return Q(**{f'{timestamp_field}__gte': start_date})
        elif time_period == 'year':
            start_date = now - timedelta(days=365)
            return Q(**{f'{timestamp_field}__gte': start_date})
        
        return Q()

class JobPostReportView(BaseReportView):
    def get(self, request):
        time_filter = self.get_time_filter(request, 'created_at')
        
        # Basic counts
        total_job_posts = JobPost.objects.filter(Q(is_deleted=False) & time_filter).count()
        published_jobs = JobPost.objects.filter(Q(status='PUBLISHED') & Q(is_deleted=False) & time_filter).count()
        draft_jobs = JobPost.objects.filter(Q(status='DRAFT') & Q(is_deleted=False) & time_filter).count()
        closed_jobs = JobPost.objects.filter(Q(status='CLOSED') & Q(is_deleted=False) & time_filter).count()
        
        # Job posts by job type
        job_types = JobPost.objects.filter(Q(is_deleted=False) & time_filter).values('job_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Job posts by employment type
        employment_types = JobPost.objects.filter(Q(is_deleted=False) & time_filter).values('employment_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Job posts by domain
        domains = JobPost.objects.filter(Q(is_deleted=False) & time_filter).values('domain').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Average salary ranges
        salary_stats = JobPost.objects.filter(Q(is_deleted=False) & time_filter).aggregate(
            avg_min_salary=Avg('min_salary'),
            avg_max_salary=Avg('max_salary')
        )
        
        # Job posts with most applications
        top_jobs = JobPost.objects.filter(Q(is_deleted=False) & time_filter).annotate(
            application_count=Count('applications')
        ).order_by('-application_count')[:10]
        
        # Monthly job posting trend (last 6 months)
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)
        
        # Base filter for monthly trends - always apply 6-month limit
        trend_filter = Q(created_at__gte=six_months_ago) & Q(is_deleted=False)
        
        # If time period is not 'all', apply additional time filter
        if request.query_params.get('time_period', 'all') != 'all':
            trend_filter &= time_filter
        
        monthly_trends = JobPost.objects.filter(trend_filter).annotate(
            month=ExtractMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Prepare response data
        data = {
            'summary': {
                'total_job_posts': total_job_posts,
                'published_jobs': published_jobs,
                'draft_jobs': draft_jobs,
                'closed_jobs': closed_jobs,
                'avg_min_salary': salary_stats['avg_min_salary'],
                'avg_max_salary': salary_stats['avg_max_salary']
            },
            'job_types': job_types,
            'employment_types': employment_types,
            'domains': domains,
            'top_jobs': JobPostReportSerializer(top_jobs, many=True).data,
            'monthly_trends': monthly_trends
        }
        
        return Response(data, status=status.HTTP_200_OK)

class UserReportView(BaseReportView):
    def get(self, request):
        time_filter = self.get_time_filter(request, 'created_at')
        
        # User type distribution
        total_users = User.objects.filter(time_filter).count()
        job_seekers = User.objects.filter(Q(user_type='job_seeker') & time_filter).count()
        job_providers = User.objects.filter(Q(user_type='job_provider') & time_filter).count()
        admins = User.objects.filter(Q(user_type='admin') & time_filter).count()
        
        # Verification status
        verified_users = User.objects.filter(Q(is_verified=True) & time_filter).count()
        unverified_users = User.objects.filter(Q(is_verified=False) & time_filter).count()
        
        # Job seeker stats - applying time filter if possible via the relationship
        # Note: This will only apply if the time filter is based on created_at
        seeker_filter = time_filter
        
        avg_job_seeker_experience = JobSeeker.objects.filter(seeker_filter).aggregate(
            avg_experience=Avg('experience')
        )['avg_experience'] or 0
        
        avg_expected_salary = JobSeeker.objects.filter(seeker_filter).aggregate(
            avg_salary=Avg('expected_salary')
        )['avg_salary'] or 0
        
        # Job provider stats - applying time filter if possible
        provider_filter = time_filter
        
        providers_by_industry = JobProvider.objects.filter(provider_filter).values('industry').annotate(
            count=Count('id')
        ).order_by('-count')
        
        providers_by_location = JobProvider.objects.filter(provider_filter).values('location').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Monthly registration trend (last 6 months)
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)
        
        # Base filter for monthly trends - always apply 6-month limit
        trend_filter = Q(created_at__gte=six_months_ago)
        
        # If time period is not 'all', apply additional time filter
        if request.query_params.get('time_period', 'all') != 'all':
            trend_filter &= time_filter
        
        monthly_trends = User.objects.filter(trend_filter).annotate(
            month=ExtractMonth('created_at')
        ).values('month', 'user_type').annotate(
            count=Count('id')
        ).order_by('month', 'user_type')
        
        # Prepare response data
        data = {
            'summary': {
                'total_users': total_users,
                'job_seekers': job_seekers,
                'job_providers': job_providers,
                'admins': admins,
                'verified_users': verified_users,
                'unverified_users': unverified_users,
                'avg_job_seeker_experience': avg_job_seeker_experience,
                'avg_expected_salary': avg_expected_salary
            },
            'providers_by_industry': providers_by_industry,
            'providers_by_location': providers_by_location,
            'monthly_trends': monthly_trends
        }
        
        return Response(data, status=status.HTTP_200_OK)

class ApplicationReportView(BaseReportView):
    def get(self, request):
        time_filter = self.get_time_filter(request, 'applied_at')  # Use applied_at for applications
        
        # Application status distribution
        total_applications = JobApplication.objects.filter(time_filter).count()
        
        status_distribution = JobApplication.objects.filter(time_filter).values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Applications by domain
        applications_by_domain = JobApplication.objects.filter(time_filter).values(
            'jobpost__domain'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Applications by job type
        applications_by_job_type = JobApplication.objects.filter(time_filter).values(
            'jobpost__job_type'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Monthly application trend (last 6 months)
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)
        
        # Base filter for monthly trends - always apply 6-month limit
        trend_filter = Q(applied_at__gte=six_months_ago)
        
        # If time period is not 'all', apply additional time filter
        if request.query_params.get('time_period', 'all') != 'all':
            trend_filter &= time_filter
        
        monthly_trends = JobApplication.objects.filter(trend_filter).annotate(
            month=ExtractMonth('applied_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Prepare response data
        data = {
            'summary': {
                'total_applications': total_applications,
            },
            'status_distribution': status_distribution,
            'applications_by_domain': applications_by_domain,
            'applications_by_job_type': applications_by_job_type,
            'monthly_trends': monthly_trends
        }
        
        return Response(data, status=status.HTTP_200_OK)

class InterviewReportView(BaseReportView):
    def get(self, request):
        # Using interview_date for time filtering is more appropriate for interviews
        time_filter = self.get_time_filter(request, 'interview_date')
        
        # Interview status distribution
        total_interviews = InterviewSchedule.objects.filter(time_filter).count()
        
        status_distribution = InterviewSchedule.objects.filter(time_filter).values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Interviews by type
        interview_types = InterviewSchedule.objects.filter(time_filter).values('interview_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Monthly interview trend (last 6 months)
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)
        
        # Base filter for monthly trends - always apply 6-month limit
        # Use created_at for trend analysis rather than interview_date
        trend_filter = Q(created_at__gte=six_months_ago)
        
        # If time period is not 'all', apply additional time filter based on interview_date
        if request.query_params.get('time_period', 'all') != 'all':
            trend_filter &= Q(interview_date__gte=self.get_time_filter(request, 'interview_date'))
        
        monthly_trends = InterviewSchedule.objects.filter(trend_filter).annotate(
            month=ExtractMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Prepare response data
        data = {
            'summary': {
                'total_interviews': total_interviews,
            },
            'status_distribution': status_distribution,
            'interview_types': interview_types,
            'monthly_trends': monthly_trends
        }
        
        return Response(data, status=status.HTTP_200_OK)