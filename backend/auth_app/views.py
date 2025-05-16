from traceback import print_tb
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from auth_app.models import JobProvider, JobSeeker, User
from auth_app.serializer import *
from rest_framework import status
from django.contrib.auth import authenticate,login
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.core.cache import cache
import random
from django.middleware.csrf import get_token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import AuthenticationFailed
import logging


logger = logging.getLogger(__name__)
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # First, try to find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if user is blocked
        if not user.is_active:
            return Response(
                {'error': 'Your account is blocked. Please contact the admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Authenticate user only if active
        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check user type and verification
        if user.user_type == 'admin':
            pass  # Add admin-specific logic if needed
        elif not user.is_verified:
            return Response(
                {'error': 'Verification failed. Sign up again'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.user_type == 'job_provider':
            try:
                job_provider = JobProvider.objects.get(user=user)
                if not job_provider.is_verified:
                    return Response(
                        {'error': 'Your account is under verification. You will receive an email after confirmation.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except JobProvider.DoesNotExist:
                return Response(
                    {'error': 'Job provider profile not found.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        login(request, user)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        response = Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': UserSerializer(user).data
        })
        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=5 * 60
        )
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=24 * 60 * 60
        )
        return response
class CookieTokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:            return Response({'error': 'Refresh token missing'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
            refresh.verify()
            access_token = str(refresh.access_token)
            response = Response({'access': access_token})
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=5 * 60
            )
            return response
        except Exception as e:
            return Response({'error': f'Invalid refresh token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)
class SignupView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        email = request.data.get('email')
        try:
            existing_user = User.objects.get(email=email)
            if existing_user.is_verified:
                return Response({'error': 'User with this email already exists and is verified.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                serializer = SignupSerializer(existing_user, data=request.data, partial=True)
        except User.DoesNotExist:
            serializer = SignupSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            cache_key = f"verification_otp_{user.email}"
            cache.set(cache_key, otp, timeout=300)

            try:
                send_mail(
                    subject='Seekerspot Email Verification OTP',
                    message=f'Your OTP to verify your email is: {otp}. It expires in 5 minutes.',
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({'error': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(
                {'message': 'User created/updated successfully. Please verify your email.', 'user': UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )

        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SendVerificationOTPView(APIView):
    def post(self, request):
        serializer = SendVerificationOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            cache_key = f"verification_otp_{email}"
            cache.set(cache_key, otp, timeout=300) 

            try:
                send_mail(
                    subject='Seekerspot Email Verification OTP',
                    message=f'Your OTP to verify your email is: {otp}. It expires in 5 minutes.',
                    from_email=None,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({'error': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({'message': 'Verification OTP sent to your email.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user.user_type == 'job_provider':
                try:
                    send_mail(
                        subject='Seekerspot Account Verification Pending',
                        message='Thank you for verifying your email. Your profile is now pending admin verification. '
                                'You will receive an email once your account has been verified by our admin team.',
                        from_email=None,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Failed to send admin verification email: {str(e)}")
            return Response({'message': 'Email verified successfully.', 'user': UserSerializer(user).data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ProfileView(APIView):
    permission_classes= [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.user_type == 'job_seeker':
            profile = JobSeeker.objects.get(user= user)
            serializer = JobSeekerProfileSerializer(profile)
        elif user.user_type == 'job_provider':
            profile = JobProvider.objects.get(user=user)
            serializer = JobProviderProfileSerializer(profile)
        else:
            serializer = UserSerializer(user)
        return Response(serializer.data)
    def put(self, request):
        user = request.user
        if user.user_type == 'job_seeker':
            profile = JobSeeker.objects.get(user = user)
            serializer = JobSeekerProfileSerializer(profile, data= request.data, partial = True)
        elif user.user_type == 'job_provider':
            profile = JobProvider.objects.get(user= user)
            serializer = JobProviderProfileSerializer(profile, data= request.data, partial = True)
        else:
            profile = UserSerializer(user)
            serializer = UserSerializer(profile, data = request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status= status.HTTP_400_BAD_REQUEST)
    
class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data = request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email= email)
            otp = ''.join([str(random.randint(0,9)) for _ in range(6)])
            cache_key = f"otp_{email}"
            cache.set(cache_key,otp,timeout=300)

            try:
                send_mail(
                    subject='Seekerspot Password Reset OTP',
                    message=f'Your OTP for password reset is: {otp}. It expires in 5 minutes.',
                    from_email=None,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({'message': 'OTP sent to your email.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                pass

        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response
    
class UserView(APIView):
    """
    Get the basic info for the currently authenticated user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = UserSerializer(user).data
        
        # Add profile-specific data
        if user.user_type == 'job_seeker':
            try:
                profile = JobSeeker.objects.get(user=user)
                user_data['job_seeker_profile'] = {
                    'id': profile.id,
                    'expected_salary': profile.expected_salary,
                    'experience': profile.experience,
                    'is_available': profile.is_available
                }
            except JobSeeker.DoesNotExist:
                pass
        elif user.user_type == 'job_provider':
            try:
                profile = JobProvider.objects.get(user=user)
                user_data['job_provider_profile'] = {
                    'id': profile.id,
                    'company_name': profile.company_name,
                }
            except JobProvider.DoesNotExist:
                pass
                
        return Response(user_data)