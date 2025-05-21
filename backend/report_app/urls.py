from django.urls import path
from .views import (
    JobPostReportView,
    UserReportView,
    ApplicationReportView,
    InterviewReportView
)

urlpatterns = [
    path('job-posts/', JobPostReportView.as_view(), name='job-post-reports'),
    path('users/', UserReportView.as_view(), name='user-reports'),
    path('applications/', ApplicationReportView.as_view(), name='application-reports'),
    path('interviews/', InterviewReportView.as_view(), name='interview-reports'),
]