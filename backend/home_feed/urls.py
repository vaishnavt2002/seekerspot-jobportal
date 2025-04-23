from django.urls import path
from .views import HomeStatsView, PopularJobsView, FeaturedJobsView

urlpatterns = [
    path('stats/', HomeStatsView.as_view(), name='home_stats'),
    path('popular-jobs/', PopularJobsView.as_view(), name='popular_jobs'),
    path('featured-jobs/', FeaturedJobsView.as_view(), name='featured_jobs'),
]