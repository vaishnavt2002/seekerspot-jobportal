from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Updated regex pattern to handle both numeric IDs and name strings
    # This pattern accepts alphanumeric characters, dashes and underscores
    re_path(r'ws/community/(?P<community_name>[\w-]+)/$', consumers.CommunityChatConsumer.as_asgi()),
]