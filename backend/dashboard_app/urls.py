from django.urls import path
from .views import (
    AdminDashboardStatsView,
    UserGrowthView,
    JobPostAnalyticsView,
    ApplicationAnalyticsView
)


urlpatterns = [
    path('dashboard-stats/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('user-growth/', UserGrowthView.as_view(), name='user-growth'),
    path('job-post-analytics/', JobPostAnalyticsView.as_view(), name='job-post-analytics'),
    path('application-analytics/', ApplicationAnalyticsView.as_view(), name='application-analytics'),
]