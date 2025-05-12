from django.shortcuts import render

# Create your views here.
# notification_app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializer import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all notifications for the current user"""
        notifications = Notification.objects.filter(recipient=request.user)[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Mark a notification as read"""
        notification_id = request.data.get('id')
        
        if notification_id:
            try:
                notification = Notification.objects.get(
                    id=notification_id,
                    recipient=request.user
                )
                notification.is_read = True
                notification.save()
            except Notification.DoesNotExist:
                pass
        else:
            # Mark all as read
            Notification.objects.filter(
                recipient=request.user,
                is_read=False
            ).update(is_read=True)
        
        # Return updated count
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({'unread_count': count})

class NotificationCountView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get unread notification count"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({'count': count})