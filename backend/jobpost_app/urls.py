from django.urls import path
from .views import *

urlpatterns = [
    path('job-posts/', JobPostView.as_view(), name='job-post-list-create'),
    path('job-posts/<int:pk>/', JobPostDetailView.as_view(), name='job-post-detail'),
    path('public/job-posts/', PublicJobPostListView.as_view(), name='public-job-post-list'),
    path('skills/search/', SkillSearchView.as_view(), name='skill-search'),
    path("public/jobs/<int:job_id>/", PublicJobPostDetailView.as_view(), name="public-job-post-detail"),
    path('jobseeker/skills/', JobSeekerSkillsView.as_view(), name='jobseeker-skills'),
    path('jobseeker/skills/add/', AddSkillsToProfileView.as_view(), name='add-skills-to-profile'),
    
    # Job applications
    path('jobseeker/apply/', ApplyForJobView.as_view(), name='apply-for-job'),
    path('jobseeker/application-status/<int:job_id>/', ApplicationStatusView.as_view(), name='application-status'),

    # Save jobs
    path('jobseeker/saved-jobs/save/', SaveJobView.as_view(), name='save-job'),
    path('jobseeker/saved-jobs/<int:job_id>/', UnsaveJobView.as_view(), name='unsave-job'),
    path('jobseeker/saved-jobs/status/<int:job_id>/', SavedJobStatusView.as_view(), name='saved-job-status'),

    # Applicants
    path('job-posts-list/', JobPostListView.as_view(), name='job-post-list'),
    path('job-posts-list/<int:pk>/', JobPostDetailForApplicantsView.as_view(), name='job-post-detail-list'),
    path('job-posts-list/<int:pk>/applicants/', JobPostApplicantsView.as_view(), name='job-post-applicants'),
    path('applications/<int:pk>/', JobApplicationStatusUpdateView.as_view(), name='application-status-update'),

    #job seeker applications
    path('job-seeker/applications/', JobSeekerApplicationsView.as_view(), name='job-seeker-applications'),

    
    path('job-posts/<int:job_id>/questions/', JobQuestionsView.as_view(), name='job-questions'),
    path('applications/<int:application_id>/answers/', QuestionAnswersView.as_view(), name='question-answers'),


]

