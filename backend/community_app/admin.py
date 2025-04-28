from django.contrib import admin

from community_app.models import Community,CommunityMember,CommunityMessage

# Register your models here.
admin.site.register([Community,CommunityMember,CommunityMessage])