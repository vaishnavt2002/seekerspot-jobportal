from django.urls import path
from .views import *

urlpatterns = [
    path('work-experiences/', WorkExperienceListCreateView.as_view(), name='work-experience-list-create'),
    path('work-experiences/<int:pk>/', WorkExperienceDetailView.as_view(), name='work-experience-detail'),
    path('educations/', EducationListCreateView.as_view(), name='education-list-create'),
    path('educations/<int:pk>/', EducationDetailView.as_view(), name='education-detail'),
    path('personal-details/', PersonalDetailsView.as_view(), name='personal-details'),
    path('profile-picture/', ProfilePictureView.as_view(), name='profile-picture'),
    path('job-provider-profile/', JobProviderProfileView.as_view(), name='job-provider-profile'),
    path('skills/search/', SkillSearchView.as_view(), name='skill-search'),
    path('skills/', JobSeekerSkillView.as_view(), name='jobseeker-skills'),
    path('skills/<int:skill_id>/', JobSeekerSkillDetailView.as_view(), name='jobseeker-skill-detail'),
    path('saved-jobs/', SavedJobPostView.as_view(), name='saved-jobs-list'),
    path('saved-jobs/<int:job_id>/', SavedJobPostView.as_view(), name='saved-job-detail'),
    path('resume/', ResumeView.as_view(), name='resume'),
]

