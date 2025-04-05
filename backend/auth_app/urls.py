from django.urls import path
from .views import *

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('send-verification-otp/', SendVerificationOTPView.as_view(), name='send_verification_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
]