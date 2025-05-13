from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification objects"""
    
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 
            'is_read', 'created_at', 'created_at_formatted',
            'source_id', 'source_type'
        ]
        read_only_fields = fields
    
    def get_created_at_formatted(self, obj):
        """Format created_at date for display"""
        return obj.created_at.strftime("%B %d, %Y at %I:%M %p")