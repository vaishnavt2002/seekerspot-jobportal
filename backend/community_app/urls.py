from django.urls import path
from .views import *

urlpatterns = [
    path('communities/', CommunityListView.as_view(), name='community-list'),
    path('communities/<int:pk>/', CommunityDetailView.as_view(), name='community-detail'),
    path('communities/<int:pk>/join/', CommunityJoinView.as_view(), name='community-join'),
    path('communities/<int:pk>/leave/', CommunityLeaveView.as_view(), name='community-leave'),
    path('members/', CommunityMemberListView.as_view(), name='member-list'),
    path('messages/', CommunityMessageListView.as_view(), name='message-list'),
    path('read-status/', UserReadStatusView.as_view(), name='read-status'),
]