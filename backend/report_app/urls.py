# reports/urls.py
from django.urls import path
from .views import (
    JobSeekerReportView,
    JobPostReportView,
    ApplicationsReportView,
    InterviewsReportView
)

urlpatterns = [
    path('admin/reports/job-seekers/', JobSeekerReportView.as_view(), name='job_seeker_report'),
    path('admin/reports/job-posts/', JobPostReportView.as_view(), name='job_post_report'),
    path('admin/reports/applications/', ApplicationsReportView.as_view(), name='applications_report'),
    path('admin/reports/interviews/', InterviewsReportView.as_view(), name='interviews_report'),
]