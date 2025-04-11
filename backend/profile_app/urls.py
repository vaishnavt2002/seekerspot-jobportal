from django.urls import path
from .views import *

urlpatterns = [
    path('work-experiences/', WorkExperienceListCreateView.as_view(), name='work-experience-list-create'),
    path('work-experiences/<int:pk>/', WorkExperienceDetailView.as_view(), name='work-experience-detail'),

]