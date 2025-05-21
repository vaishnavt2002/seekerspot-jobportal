from rest_framework import serializers
from jobpost_app.models import JobPost, JobApplication
from auth_app.models import User, JobSeeker, JobProvider
from interview_app.models import InterviewSchedule

class JobPostReportSerializer(serializers.ModelSerializer):
    application_count = serializers.IntegerField()
    company_name = serializers.CharField(source='job_provider.company_name')
    
    class Meta:
        model = JobPost
        fields = ['id', 'title', 'job_type', 'employment_type', 'domain', 
                  'min_salary', 'max_salary', 'application_count', 'company_name']

class UserReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'user_type', 'is_verified', 'created_at']

class ApplicationReportSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='jobpost.title')
    company_name = serializers.CharField(source='jobpost.job_provider.company_name')
    applicant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JobApplication
        fields = ['id', 'status', 'applied_at', 'job_title', 'company_name', 'applicant_name']
    
    def get_applicant_name(self, obj):
        user = obj.job_seeker.user
        return f"{user.first_name} {user.last_name}" if user.first_name else user.username

class InterviewReportSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='application.jobpost.title')
    applicant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InterviewSchedule
        fields = ['id', 'status', 'interview_type', 'interview_date', 'interview_time', 
                  'created_at', 'job_title', 'applicant_name']
    
    def get_applicant_name(self, obj):
        user = obj.application.job_seeker.user
        return f"{user.first_name} {user.last_name}" if user.first_name else user.username