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
]

