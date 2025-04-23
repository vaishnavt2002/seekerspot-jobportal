from rest_framework import serializers
from .models import InterviewSchedule

class InterviewScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSchedule
        fields = [
            'id', 'application', 'interview_date', 'interview_time', 'interview_type',
            'status', 'meeting_id', 'notes', 'completed_at', 'created_at', 'updated_at'
        ]