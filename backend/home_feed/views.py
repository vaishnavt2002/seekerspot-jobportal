from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count
from auth_app.models import User, JobSeeker, JobProvider
from jobpost_app.models import JobPost, JobApplication, Skills
from profile_app.models import JobSeekerSkill
from datetime import datetime, timedelta
from django.utils import timezone

class HomeStatsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            live_jobs_count = JobPost.objects.filter(
                status='PUBLISHED', 
                is_deleted=False,
                application_deadline__gte=timezone.now()
            ).count()
            
            companies_count = JobProvider.objects.filter(is_verified=False).count()
            candidates_count = JobSeeker.objects.all().count()
            
            seven_days_ago = timezone.now() - timedelta(days=7)
            new_jobs_count = JobPost.objects.filter(
                status='PUBLISHED',
                is_deleted=False,
                created_at__gte=seven_days_ago
            ).count()
            
            return Response({
                'live_jobs': live_jobs_count,
                'companies': companies_count,
                'candidates': candidates_count,
                'new_jobs': new_jobs_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in HomeStatsView: {str(e)}")
            return Response({
                'error': 'Failed to fetch home stats'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PopularJobsView(APIView):
    """View to get popular jobs based on number of applications"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get the top 6 jobs with most applications"""
        try:
            # Get jobs with most applications
            popular_jobs = JobPost.objects.filter(
                status='PUBLISHED', 
                is_deleted=False,
                application_deadline__gte=timezone.now()
            ).annotate(
                application_count=Count('applications')
            ).order_by('-application_count')[:6]
            
            # Serialize the data
            jobs_data = []
            for job in popular_jobs:
                jobs_data.append({
                    'id': job.id,
                    'title': job.title,
                    'company': job.job_provider.company_name,
                    'company_logo': job.job_provider.company_logo.url if job.job_provider.company_logo else None,
                    'location': job.location,
                    'type': job.employment_type,
                    'salary': f"Rs {job.min_salary:,} - Rs {job.max_salary:,}",
                    'posted': self._get_time_ago(job.created_at),
                    'application_count': job.application_count
                })
            
            return Response(jobs_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in PopularJobsView: {str(e)}")
            return Response({
                'error': 'Failed to fetch popular jobs'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_time_ago(self, created_date):
        now = timezone.now()
        diff = now - created_date
        
        if diff.days == 0:
            if diff.seconds < 60:
                return 'just now'
            elif diff.seconds < 3600:
                minutes = diff.seconds // 60
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                hours = diff.seconds // 3600
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.days == 1:
            return '1 day ago'
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        else:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"


class FeaturedJobsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            try:
                job_seeker = JobSeeker.objects.get(user=request.user)
            except JobSeeker.DoesNotExist:
                return Response({
                    'error': 'JobSeeker profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            job_seeker_skills = JobSeekerSkill.objects.filter(job_seeker=job_seeker)
            skill_ids = [js_skill.skill.id for js_skill in job_seeker_skills]
            
            if not skill_ids:
                featured_jobs = JobPost.objects.filter(
                    status='PUBLISHED', 
                    is_deleted=False,
                    application_deadline__gte=timezone.now()
                ).order_by('-created_at')[:6]
            else:
                featured_jobs = JobPost.objects.filter(
                    status='PUBLISHED', 
                    is_deleted=False,
                    application_deadline__gte=timezone.now(),
                    skills__id__in=skill_ids
                ).distinct().order_by('-created_at')[:6]
            
            jobs_data = []
            for job in featured_jobs:
                jobs_data.append({
                    'id': job.id,
                    'title': job.title,
                    'company': job.job_provider.company_name,
                    'company_logo': job.job_provider.company_logo.url if job.job_provider.company_logo else None,
                    'location': job.location,
                    'type': job.employment_type,
                    'salary': f"Rs {job.min_salary:,} - Rs {job.max_salary:,}",
                    'posted': self._get_time_ago(job.created_at)
                })
            
            return Response(jobs_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in FeaturedJobsView: {str(e)}")
            return Response({
                'error': 'Failed to fetch featured jobs'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_time_ago(self, created_date):
        """Helper function to format time ago"""
        now = timezone.now()
        diff = now - created_date
        
        if diff.days == 0:
            if diff.seconds < 60:
                return 'just now'
            elif diff.seconds < 3600:
                minutes = diff.seconds // 60
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                hours = diff.seconds // 3600
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.days == 1:
            return '1 day ago'
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        else:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"