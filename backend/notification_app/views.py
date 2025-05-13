from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import Notification
from .serializer import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50

class NotificationListView(APIView):
    """List all notifications for the current user"""
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination
    
    def get(self, request):
        try:
            # Get filter parameters
            is_read = request.query_params.get('is_read')
            notification_type = request.query_params.get('type')
            
            # Build query
            notifications = Notification.objects.filter(user=request.user)
            
            if is_read is not None:
                is_read = is_read.lower() == 'true'
                notifications = notifications.filter(is_read=is_read)
            
            if notification_type:
                notifications = notifications.filter(notification_type=notification_type)
            
            # Apply pagination
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(notifications, request)
            serializer = NotificationSerializer(page, many=True)
            
            return paginator.get_paginated_response(serializer.data)
        
        except Exception as e:
            logger.exception(f"Error in NotificationListView: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving notifications'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MarkNotificationReadView(APIView):
    """Mark a notification as read"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            
            serializer = NotificationSerializer(notification)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            logger.exception(f"Error in MarkNotificationReadView: {str(e)}")
            return Response(
                {'error': 'An error occurred while marking notification as read'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read for the current user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            
            return Response(
                {'message': 'All notifications marked as read'},
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.exception(f"Error in MarkAllNotificationsReadView: {str(e)}")
            return Response(
                {'error': 'An error occurred while marking all notifications as read'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class NotificationCountView(APIView):
    """Get count of unread notifications"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            count = Notification.objects.filter(user=request.user, is_read=False).count()
            
            return Response(
                {'unread_count': count},
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.exception(f"Error in NotificationCountView: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving notification count'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )