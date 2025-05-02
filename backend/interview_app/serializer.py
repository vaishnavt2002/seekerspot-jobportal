from rest_framework import serializers
from .models import InterviewSchedule

class InterviewScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSchedule
        fields = [
            'id', 'application', 'interview_date', 'interview_time', 'interview_type',
            'status', 'meeting_id', 'notes', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['meeting_id', 'status', 'completed_at', 'created_at', 'updated_at']

    def validate(self, data):
        interview_type = data.get('interview_type')
        if interview_type not in dict(InterviewSchedule.INTERVIEW_TYPE_CHOICES):
            raise serializers.ValidationError({
                'interview_type': 'Invalid interview type'
            })
        return data