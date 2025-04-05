import email
from rest_framework import serializers
from .models import User, JobProvider, JobSeeker
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import random

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'user_type', 'profile_picture', 'phone_number', 'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only = True)
    user_type = serializers.ChoiceField(choices=User.USER_TYPE_CHOICES)
    class Meta:
        model = User
        fields = ['email','username','password','user_type', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            phone_number=validated_data['phone_number']
        )
        if user.user_type == 'job_seeker':
            JobSeeker.objects.create(user=user, expected_salary = 0)
        elif user.user_type == 'job_provider':
            JobProvider.objects.create(user= user, company_name=validated_data['company_name'])
        return user
    
class JobSeekerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    class Meta:
        model = JobSeeker
        fields = ['user', 'resume', 'summary', 'experience', 'current_salary', 'expected_salary', 'is_available']
class JobProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    class Meta:
        model = JobProvider
        fields = ['user', 'company_name', 'company_logo', 'industry', 'company_website', 'description', 'location']

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user with the email exists")
        return value
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()
    new_password = serializers.CharField(write_only = True)
    def validate(self, data):
        email = data.get('email')
        otp = data.get('otp')
        cache_key = f"otp_{email}"
        stored_otp = cache.get(cache_key)
        if not stored_otp or stored_otp != otp:
            
            raise serializers.ValidationError("Invalid or expired OTP.")
        return data
    
    def save(self):
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        cache.delete(f"otp_{email}")
        return user
    
class SendVerificationOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user with this email exists.")
        if User.objects.get(email=value).is_verified:
            raise serializers.ValidationError("Email is already verified.")
        return value

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        email = data.get('email')
        otp = data.get('otp')
        cache_key = f"verification_otp_{email}"
        stored_otp = cache.get(cache_key)

        if not stored_otp or stored_otp != otp:
            raise serializers.ValidationError("Invalid or expired OTP.")
        return data

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        user.is_verified = True
        user.save()
        cache.delete(f"verification_otp_{email}")  # Clear OTP
        return user
