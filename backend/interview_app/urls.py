# interview_app/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('job-posts-list/<int:pk>/shortlisted/', ShortlistedApplicantsView.as_view(), name='job-post-shortlisted'),
    path('interviews/', InterviewScheduleCreateView.as_view(), name='interview-create'),
    path('interviews/<int:pk>/', InterviewScheduleUpdateView.as_view(), name='interview-update'),
    path('interviews/<int:pk>/cancel/', InterviewScheduleCancelView.as_view(), name='interview-cancel'),
    path('interviews/<int:pk>/complete/', InterviewScheduleCompleteView.as_view(), name='interview-complete'),
    path('job-seeker/interviews/', JobSeekerInterviewsView.as_view(), name='job-seeker-interviews'),
    path('interview/meetings/<str:meeting_id>/', MeetingDetailView.as_view(), name='meeting-detail'),
]