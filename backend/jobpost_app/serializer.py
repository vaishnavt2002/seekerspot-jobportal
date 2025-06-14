from rest_framework import serializers

from auth_app import serializer
from .models import *
from auth_app.models import User
from profile_app.models import Education, WorkExperience, JobSeekerSkill
from jobpost_app.models import JobPost
from interview_app.serializer import InterviewScheduleSerializer
from interview_app.models import InterviewSchedule

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skills
        fields = ['id', 'name', 'category']

class JobQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobQuestion
        fields = ['id', 'question_text', 'question_type', 'created_at']

class JobQuestionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobQuestionAnswer
        fields = ['id', 'question', 'answer_text', 'created_at']
class JobPostSerializer(serializers.ModelSerializer):
    requirements = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
    )
    responsibilities = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
    )
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    requirements_display = serializers.SerializerMethodField()
    responsibilities_display = serializers.SerializerMethodField()
    questions = JobQuestionSerializer(many=True, read_only=True)
    questions_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = JobPost
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'id', 'job_provider', 'is_deleted']

    def get_requirements_display(self, obj):
        return obj.requirements.split('\n') if obj.requirements else []

    def get_responsibilities_display(self, obj):
        return obj.responsibilities.split('\n') if obj.responsibilities else []

    def create(self, validated_data):
        requirements = validated_data.pop('requirements', [])
        responsibilities = validated_data.pop('responsibilities', [])
        skill_ids = validated_data.pop('skill_ids', [])

        questions_data = validated_data.pop('questions_data', [])

        validated_data['requirements'] = '\n'.join(requirements)
        validated_data['responsibilities'] = '\n'.join(responsibilities)
        validated_data['job_provider'] = self.context['request'].user.job_provider_profile
        job_post = super().create(validated_data)
        if skill_ids:
            job_post.skills.set(skill_ids)

        for question_data in questions_data:
            JobQuestion.objects.create(
                job_post=job_post,
                question_text=question_data.get('question_text', ''),
                question_type=question_data.get('question_type', 'DESCRIPTIVE')
            )
        
        return job_post

    def update(self, instance, validated_data):
        requirements = validated_data.pop('requirements', None)
        responsibilities = validated_data.pop('responsibilities', None)
        skill_ids = validated_data.pop('skill_ids', None)

        questions_data = validated_data.pop('questions_data', None)

        if requirements is not None:
            instance.requirements = '\n'.join(requirements)
        if responsibilities is not None:
            instance.responsibilities = '\n'.join(responsibilities)
        if skill_ids is not None:
            instance.skills.set(skill_ids)
        if questions_data is not None:
            # Delete existing questions
            instance.questions.all().delete()
            
            # Create new questions
            for question_data in questions_data:
                JobQuestion.objects.create(
                    job_post=instance,
                    question_text=question_data.get('question_text', ''),
                    question_type=question_data.get('question_type', 'DESCRIPTIVE')
                )
        return super().update(instance, validated_data)

class PublicJobPostSerializer(serializers.ModelSerializer):
    job_provider = serializers.SerializerMethodField()
    requirements_display = serializers.SerializerMethodField()
    responsibilities_display = serializers.SerializerMethodField()
    skills = SkillSerializer(many=True)
    questions = serializers.SerializerMethodField()

    class Meta:
        model = JobPost
        fields = [
            "id",
            "title",
            "description",
            "requirements_display",
            "responsibilities_display",
            "skills",
            "location",
            "job_type",
            "employment_type",
            "domain",
            "experience_level",
            "min_salary",
            "max_salary",
            "application_deadline",
            "status",
            "created_at",
            "job_provider",
            "questions",
        ]

    def get_job_provider(self, obj):
        return {
            "company_name": obj.job_provider.company_name,
            "company_logo": obj.job_provider.company_logo.url if obj.job_provider.company_logo else None,
        }

    def get_requirements_display(self, obj):
        return obj.requirements.split("\n") if obj.requirements else []

    def get_responsibilities_display(self, obj):
        return obj.responsibilities.split("\n") if obj.responsibilities else []
        
    def get_questions(self, obj):
        questions = JobQuestion.objects.filter(job_post=obj)
        return JobQuestionSerializer(questions, many=True).data
    
class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JobApplication
        fields = [
            'id',
            'jobpost',
            'job_title',
            'company_name',
            'status',
            'applied_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'jobpost', 'job_seeker', 'status', 'applied_at', 'updated_at']
    
    def get_job_title(self, obj):
        return obj.jobpost.title
    
    def get_company_name(self, obj):
        return obj.jobpost.job_provider.company_name
    
# save job
class SavedJobSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedJob
        fields = [
            'id',
            'jobpost',
            'job_title',
            'company_name',
            'saved_at'
        ]
        read_only_fields = ['id', 'job_seeker', 'saved_at']
    
    def get_job_title(self, obj):
        return obj.jobpost.title
    
    def get_company_name(self, obj):
        return obj.jobpost.job_provider.company_name


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class JobSeekerSkillSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='skill.name')
    category = serializers.CharField(source='skill.category')
    
    class Meta:
        model = JobSeekerSkill
        fields = ['id', 'name', 'category']


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'description']


class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = ['id', 'company', 'title', 'location', 'start_date', 'end_date', 'description']


class JobSeekerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = JobSeeker
        fields = [
            'id', 'user', 'resume', 'summary', 'experience', 
            'current_salary', 'expected_salary', 'is_available'
        ]


class JobPostListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='job_provider.company_name')
    applicants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPost
        fields = [
            'id', 'title', 'company_name', 'location', 'job_type', 
            'employment_type', 'status', 'application_deadline', 'applicants_count'
        ]
    
    def get_applicants_count(self, obj):
        return obj.applications.count()


class JobApplicationDetailSerializer(serializers.ModelSerializer):
    job_seeker = JobSeekerSerializer()
    skills = serializers.SerializerMethodField()
    education = serializers.SerializerMethodField()
    work_experience = serializers.SerializerMethodField()
    skill_match = serializers.SerializerMethodField()
    interviews = serializers.SerializerMethodField()
    question_answers = serializers.SerializerMethodField()  # Add this line
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'jobpost', 'job_seeker', 'status', 'applied_at', 'updated_at',
            'skills', 'education', 'work_experience', 'skill_match', 'interviews',
            'question_answers'  # Add this line
        ]
    
    def get_skills(self, obj):
        job_seeker_skills = JobSeekerSkill.objects.filter(job_seeker=obj.job_seeker)
        return JobSeekerSkillSerializer(job_seeker_skills, many=True).data
    
    def get_education(self, obj):
        education = Education.objects.filter(job_seeker=obj.job_seeker)
        return EducationSerializer(education, many=True).data
    
    def get_work_experience(self, obj):
        work_experience = WorkExperience.objects.filter(job_seeker=obj.job_seeker)
        return WorkExperienceSerializer(work_experience, many=True).data
    
    def get_skill_match(self, obj):
        job_seeker = obj.job_seeker
        jobpost = obj.jobpost
        
        # Get user skills and job skills
        user_skill_ids = set(js_skill.skill.id for js_skill in JobSeekerSkill.objects.filter(job_seeker=job_seeker))
        job_skill_ids = set(skill.id for skill in jobpost.skills.all())
        
        # Calculate matching skills percentage
        total_job_skills = len(job_skill_ids)
        matching_skills = len(user_skill_ids.intersection(job_skill_ids))
        match_percentage = (matching_skills / total_job_skills * 100) if total_job_skills > 0 else 0
        
        return {
            "matching_skills": matching_skills,
            "total_skills": total_job_skills,
            "match_percentage": round(match_percentage, 1)
        }
        
    def get_interviews(self, obj):
        """Get all interviews for this application"""
        interviews = InterviewSchedule.objects.filter(application=obj.id)
        return InterviewScheduleSerializer(interviews, many=True).data
    
    def get_question_answers(self, obj):
        """Get all question answers for this application"""
        answers = JobQuestionAnswer.objects.filter(application=obj).select_related('question')
        return [{
            'question_id': answer.question.id,
            'question_text': answer.question.question_text,
            'question_type': answer.question.question_type,
            'answer_text': answer.answer_text,
            'answered_at': answer.created_at
        } for answer in answers]
        
    def get_interviews(self, obj):
        interviews = InterviewSchedule.objects.filter(application=obj.id)
        return InterviewScheduleSerializer(interviews, many=True).data
    
    def get_question_answers(self, obj):
        answers = JobQuestionAnswer.objects.filter(application=obj).select_related('question')
        return [{
            'question_id': answer.question.id,
            'question_text': answer.question.question_text,
            'question_type': answer.question.question_type,
            'answer_text': answer.answer_text,
            'answered_at': answer.created_at
        } for answer in answers]
class JobSeekerApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='jobpost.title')
    company_name = serializers.CharField(source='jobpost.job_provider.company_name')
    company_logo = serializers.SerializerMethodField()
    job_details = serializers.SerializerMethodField()
    interviews = InterviewScheduleSerializer(many=True)

    class Meta:
        model = JobApplication
        fields = [
            'id',
            'jobpost',
            'job_title',
            'company_name',
            'company_logo',
            'status',
            'applied_at',
            'updated_at',
            'job_details',
            'interviews',
        ]
        read_only_fields = ['id', 'jobpost', 'job_seeker', 'status', 'applied_at', 'updated_at']

    def get_company_logo(self, obj):
        return obj.jobpost.job_provider.company_logo.url if obj.jobpost.job_provider.company_logo else None

    def get_job_details(self, obj):
        job = obj.jobpost
        return {
            'location': job.location,
            'job_type': job.job_type,
            'employment_type': job.employment_type,
            'domain': job.domain,
            'min_salary': job.min_salary,
            'max_salary': job.max_salary,
            'application_deadline': job.application_deadline,
            'skills': SkillSerializer(job.skills.all(), many=True).data,
        }
    
