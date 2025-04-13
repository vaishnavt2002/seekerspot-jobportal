from rest_framework import serializers
from .models import *
from auth_app.models import *

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
    email = serializers.EmailField(source='user.email')
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
        """
        Ensure consistent output even for minimal data.
        """
        data = super().to_representation(instance)
        return {
            'first_name': data.get('first_name') or '',
            'last_name': data.get('last_name') or '',
            'email': data.get('email') or '',
            'profile_picture': data.get('profile_picture'),  # URL or null
            'summary': data.get('summary'),  # Keep null if unset
            'experience': data.get('experience') if data.get('experience') is not None else 0,
            'current_salary': data.get('current_salary'),  # Keep null if unset
            'expected_salary': data.get('expected_salary') if data.get('expected_salary') is not None else 0,
            'is_available': data.get('is_available') if data.get('is_available') is not None else True,
        }

    def update(self, instance, validated_data):
        # Extract user-related fields
        user_data = validated_data.pop('user', {})
        instance.user.first_name = user_data.get('first_name', instance.user.first_name) or ''
        instance.user.last_name = user_data.get('last_name', instance.user.last_name) or ''
        instance.user.save()

        # Update JobSeeker fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate(self, data):
        # Ensure expected_salary is non-negative
        expected_salary = data.get('expected_salary')
        if expected_salary is not None and expected_salary < 0:
            raise serializers.ValidationError("Expected salary must be non-negative.")

        # Ensure current_salary is non-negative if provided
        current_salary = data.get('current_salary')
        if current_salary is not None and current_salary < 0:
            raise serializers.ValidationError("Current salary must be non-negative.")

        # Ensure experience is non-negative
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
    class Meta:
        model = JobProvider
        fields = [
            'company_name',
            'company_logo',
            'industry',
            'company_website',
            'description',
            'location',
        ]
