from django.urls import path
from .views import *

urlpatterns = [
    path('job-posts/', JobPostView.as_view(), name='job-post-list-create'),
    path('job-posts/<int:pk>/', JobPostDetailView.as_view(), name='job-post-detail'),
    path('public/job-posts/', PublicJobPostListView.as_view(), name='public-job-post-list'),
    path('skills/search/', SkillSearchView.as_view(), name='skill-search'),
    path("public/jobs/<int:job_id>/", PublicJobPostDetailView.as_view(), name="public-job-post-detail"),
]

