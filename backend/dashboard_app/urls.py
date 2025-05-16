from django.urls import path
from .views import *


urlpatterns = [
    path('dashboard-stats/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('user-growth/', UserGrowthView.as_view(), name='user-growth'),
    path('job-post-analytics/', JobPostAnalyticsView.as_view(), name='job-post-analytics'),
    path('application-analytics/', AdminApplicationAnalyticsView.as_view(), name='application-analytics'),

    # Job Provider dashboard URLs
    path('provider/dashboard-stats/', JobProviderStatsView.as_view(), name='provider-dashboard-stats'),
    path('provider/job-activity/', JobPostActivityView.as_view(), name='provider-job-activity'),
    path('provider/application-analytics/', ApplicationAnalyticsView.as_view(), name='provider-application-analytics'),
    path('provider/upcoming-interviews/', UpcomingInterviewsView.as_view(), name='provider-upcoming-interviews'),
]