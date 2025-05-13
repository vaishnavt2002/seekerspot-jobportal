from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import community_app.routing
import interview_app.routing
import notification_app.routing

application = ProtocolTypeRouter({
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                community_app.routing.websocket_urlpatterns+
                notification_app.routing.websocket_urlpatterns
            )
        )
    ),
})