from dataclasses import field
from os import read
from rest_framework import serializers
from .models import *
from auth_app.models import *
from jobpost_app.models import SavedJob,JobPost

class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = '__all__'
        read_only_fields = ['job_seeker']
    def validate(self, data):
        if data.get('end_date') and data.get('start_date') > data.get('end_date'):
            raise serializers.ValidationError("End date must be after start date.")
        return data
    
class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'
        read_only_fields = ['job_seeker']
    def validate(self, data):
        if data.get('end_date') and data.get('start_date') > data.get('end_date'):
            raise serializers.ValidationError("End date must be after start date.")
        return data
    
class JobSeekerSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', allow_blank=True, default='')
    last_name = serializers.CharField(source='user.last_name', allow_blank=True, default='')
    email = serializers.EmailField(source='user.email',read_only=True)
    profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True, allow_null=True)

    class Meta:
        model = JobSeeker
        fields = [
            'first_name',
            'last_name',
            'email',
            'profile_picture',
            'summary',
            'experience',
            'current_salary',
            'expected_salary',
            'is_available',
        ]
        read_only_fields = ['email', 'profile_picture']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'first_name': data.get('first_name') or '',
            'last_name': data.get('last_name') or '',
            'email': data.get('email') or '',
            'profile_picture': data.get('profile_picture'),
            'summary': data.get('summary'),
            'experience': data.get('experience') if data.get('experience') is not None else 0,
            'current_salary': data.get('current_salary'),
            'expected_salary': data.get('expected_salary') if data.get('expected_salary') is not None else 0,
            'is_available': data.get('is_available') if data.get('is_available') is not None else True,
        }

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        instance.user.first_name = user_data.get('first_name', instance.user.first_name) or ''
        instance.user.last_name = user_data.get('last_name', instance.user.last_name) or ''
        instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate(self, data):
        expected_salary = data.get('expected_salary')
        if expected_salary is not None and expected_salary < 0:
            raise serializers.ValidationError("Expected salary must be non-negative.")

        current_salary = data.get('current_salary')
        if current_salary is not None and current_salary < 0:
            raise serializers.ValidationError("Current salary must be non-negative.")

        experience = data.get('experience')
        if experience is not None and experience < 0:
            raise serializers.ValidationError("Experience must be non-negative.")

        return data
    
class ProfilePictureSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(allow_null=True)

    class Meta:
        model = User
        fields = ['profile_picture']

    def update(self, instance, validated_data):
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.save()
        return instance
    
class JobProviderProfileSerializer(serializers.ModelSerializer):
    company_logo_url = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = JobProvider
        fields = [
            'company_name',
            'company_logo',
            'company_logo_url',
            'industry',
            'company_website',
            'description',
            'location',
        ]
    def get_company_logo_url(self, obj):
        if obj.company_logo:
            return obj.company_logo.url
        return None

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skills
        fields = ['id', 'name', 'category']

class JobSeekerSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    skill_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = JobSeekerSkill
        fields = ['id', 'skill', 'skill_id', 'skill_ids', 'added_at']

    def validate(self, data):
        if not data.get('skill_id') and not data.get('skill_ids'):
            raise serializers.ValidationError("Either 'skill_id' or 'skill_ids' must be provided.")
        if data.get('skill_id') and data.get('skill_ids'):
            raise serializers.ValidationError("Provide either 'skill_id' or 'skill_ids', not both.")
        return data

    def validate_skill_id(self, value):
        if not Skills.objects.filter(id=value).exists():
            raise serializers.ValidationError("Skill does not exist.")
        job_seeker = self.context['request'].user.job_seeker_profile
        if JobSeekerSkill.objects.filter(job_seeker=job_seeker, skill_id=value).exists():
            raise serializers.ValidationError("This skill is already added to your profile.")
        return value

    def validate_skill_ids(self, value):
        job_seeker = self.context['request'].user.job_seeker_profile
        errors = []
        for skill_id in value:
            if not Skills.objects.filter(id=skill_id).exists():
                errors.append(f"Skill with ID {skill_id} does not exist.")
            elif JobSeekerSkill.objects.filter(job_seeker=job_seeker, skill_id=skill_id).exists():
                errors.append(f"Skill with ID {skill_id} is already added to your profile.")
        if errors:
            raise serializers.ValidationError(errors)
        return value

    def create(self, validated_data):
        job_seeker = self.context['job_seeker']
        skill_ids = validated_data.pop('skill_ids', None)
        skill_id = validated_data.pop('skill_id', None)

        if skill_id:
            skill = Skills.objects.get(id=skill_id)
            return JobSeekerSkill.objects.create(job_seeker=job_seeker, skill=skill, **validated_data)
        elif skill_ids:
            instances = []
            for skill_id in skill_ids:
                skill = Skills.objects.get(id=skill_id)
                instance = JobSeekerSkill.objects.create(job_seeker=job_seeker, skill=skill, **validated_data)
                instances.append(instance)
            return instances
        
class JobPostSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    class Meta:
        model = JobPost
        fields = [
            'id', 'title', 'description', 'requirements', 'responsibilities',
            'location', 'job_type', 'employment_type', 'domain', 'experience_level',
            'min_salary', 'max_salary', 'application_deadline', 'status', 'created_at','company_name'
        ]
    def get_company_name(self, obj):
        return obj.job_provider.company_name if obj.job_provider else None
        
class SavedJobSerializer(serializers.ModelSerializer):
    jobpost = JobPostSerializer(read_only=True)
    
    class Meta:
        model = SavedJob
        fields = ['id', 'jobpost', 'job_seeker', 'saved_at']
        
class ResumeSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    uploaded_at = serializers.SerializerMethodField()

    class Meta:
        model = JobSeeker
        fields = ['resume', 'filename', 'url', 'uploaded_at']
        read_only_fields = ['filename', 'url', 'uploaded_at']

    def get_filename(self, obj):
        if obj.resume:
            return obj.resume.name.split('/')[-1]
        return None

    def get_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.resume.url) if request else obj.resume.url
        return None
    
    def get_uploaded_at(self, obj):
        return obj.updated_at