# backend/asgi.py
import os
import django

# Set up the Django settings environment variable first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django BEFORE importing any Django-related modules
django.setup()

# Only import these AFTER Django is set up
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
import community_app.routing
import interview_app.routing
import notification_app.routing

# Create the ASGI application
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                community_app.routing.websocket_urlpatterns + 
                interview_app.routing.websocket_urlpatterns +
                notification_app.routing.websocket_urlpatterns
            )
        )
    ),
})