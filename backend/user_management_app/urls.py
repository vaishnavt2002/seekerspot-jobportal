from django.urls import path
from .views import *


urlpatterns = [
    path('job-seekers/', JobSeekerAdminView.as_view(), name='job-seeker-list'),
    path('job-seekers/<int:pk>/', JobSeekerAdminView.as_view(), name='job-seeker-detail'),
    path('job-seekers/<int:pk>/block/', JobSeekerBlockView.as_view(), name='job-seeker-block'),
    path('job-providers/', JobProviderAdminView.as_view(), name='job-provider-list'),
    path('job-providers/<int:pk>/', JobProviderAdminView.as_view(), name='job-provider-detail'),
    path('job-providers/<int:pk>/block/', JobProviderBlockView.as_view(), name='job-provider-block'),
    path('job-providers/<int:pk>/verify/', JobProviderVerifyView.as_view(), name='job-provider-verify')
]