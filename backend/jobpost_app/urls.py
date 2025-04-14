from django.urls import path
from .views import *

urlpatterns = [
    path('', JobPostView.as_view(), name='job-post-list-create'),
    path('<int:pk>/', JobPostDetailView.as_view(), name='job-post-detail'),
]

