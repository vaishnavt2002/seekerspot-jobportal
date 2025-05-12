from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'source_id', 
                  'source_type', 'is_read', 'created_at', 'time_ago']
    
    def get_time_ago(self, obj):
        """Return a simple time-ago string"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'just now'
        elif diff < timedelta(hours=1):
            return f'{diff.seconds // 60}m ago'
        elif diff < timedelta(days=1):
            return f'{diff.seconds // 3600}h ago'
        elif diff < timedelta(days=7):
            return f'{diff.days}d ago'
        else:
            return obj.created_at.strftime('%d %b')