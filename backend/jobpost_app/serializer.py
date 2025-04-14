from os import write
import re
from urllib import response
from rest_framework import serializers
from .models import *

class JobPostSerializer(serializers.ModelSerializer):
    requirements = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
    )
    responsibilities = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
    )
    requirements_display = serializers.SerializerMethodField()
    responsibilities_display = serializers.SerializerMethodField()
    class Meta:
        model = JobPost
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at','id', 'job_provider','is_deleted']
    def get_requirements_display(self, obj):
        return obj.requirements.split('\n') if obj.requirements else []
    def get_responsibilities_display(self, obj):
        return obj.responsibilities.split('\n') if obj.responsibilities else []
    def create(self, validated_data):  
        requirements = validated_data.pop('requirements', [])
        responsibilities = validated_data.pop('responsibilities', [])
        validated_data['requirements'] = '\n'.join(requirements)
        validated_data['responsibilities'] = '\n'.join(responsibilities)
        validated_data['job_provider'] = self.context['request'].user.job_provider_profile
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        requirements = validated_data.pop('requirements', None)
        responsibilities = validated_data.pop('responsibilities', None)
        if requirements is not None:
            instance.requirements = '\n'.join(requirements)
        if responsibilities is not None:
            instance.responsibilities = '\n'.join(responsibilities)
        return super().update(instance, validated_data)
    


    