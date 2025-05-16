from rest_framework import serializers
from auth_app.models import User, JobSeeker, JobProvider


class JobSeekerAdminSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    phone_number = serializers.CharField(source='user.phone_number')
    is_active = serializers.BooleanField(source='user.is_active')
    is_verified = serializers.BooleanField(source='user.is_verified')
    profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)

    class Meta:
        model = JobSeeker
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'resume', 'summary', 'experience', 'current_salary',
            'expected_salary', 'is_available', 'is_active', 'is_verified',
            'profile_picture', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'id']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Update job seeker fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
    

from rest_framework import serializers
from auth_app.models import User, JobProvider

class JobProviderAdminSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    phone_number = serializers.CharField(source='user.phone_number')
    is_active = serializers.BooleanField(source='user.is_active')
    profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)

    class Meta:
        model = JobProvider
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'company_name', 'company_logo', 'industry', 'company_website',
            'description', 'location', 'is_active', 'is_verified',
            'profile_picture', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'id']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Update job provider fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance