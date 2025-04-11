from rest_framework import serializers
from .models import *

class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = '__all__'
        read_only_fields = ['job_seeker']
    def validate(self, data):
        if data.get('end_date') and data.get('start_date') > data.get('end_date'):
            raise serializers.ValidationError("End date must be after start date.")
        return data
    
class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'
        read_only_fields = ['job_seeker']
    def validate(self, data):
        if data.get('end_date') and data.get('start_date') > data.get('end_date'):
            raise serializers.ValidationError("End date must be after start date.")
        return data