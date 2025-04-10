from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from auth_app.models import JobProvider, JobSeeker, User
from auth_app.serializer import *
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.core.cache import cache
import random
from django.middleware.csrf import get_token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import AuthenticationFailed

# Create your views here.
class CookieTokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        print(f"Refresh token from cookies: {refresh_token[:10]}... (truncated)")

        if refresh_token is None:
            return Response({'error': 'Refresh token not found in cookies'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Add debugging for token validation
            try:
                # This will verify the token signature and expiration
                refresh = RefreshToken(refresh_token)
                access_token = str(refresh.access_token)
                
                response = Response({
                    'access': access_token,
                    'message': 'Token refreshed successfully'
                })

                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    httponly=True,
                    secure=False,
                    samesite='Lax',
                    max_age=3600
                )

                return response
            except Exception as token_error:
                print(f"Token validation error details: {str(token_error)}")
                raise TokenError(f"Token validation failed: {str(token_error)}")

        except TokenError as e:
            return Response({'error': f'Invalid refresh token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)
class SignupView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        print("Request headers:", request.headers)  # Debug: See Content-Type
        print("Request data:", request.data)
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
                {'message': 'User created successfully. Please verify your email.', 'user': UserSerializer(user).data},
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
            return Response({'message': 'Email verified successfully.', 'user': UserSerializer(user).data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        if user:
            if not user.is_verified:
                return Response({'error': 'Please verify your email first.'}, status=status.HTTP_403_FORBIDDEN)
            refresh = RefreshToken.for_user(user)
            response = Response({
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=10000
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=7 * 24 * 60 * 60  # 7 days
            )
            response.data['csrf_token'] = get_token(request)
            return response
        return Response({'errors': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
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
            except TokenError:
                pass 

        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')


        return response