# auth_app/authentication.py

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')
        logger.debug(f"Access token from cookie: {access_token}")

        if not access_token:
            logger.debug("No access token in cookies")
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
            
            # Check if user has logged out
            cache_key = f"logout_{user.id}"
            if cache.get(cache_key):
                logger.debug(f"User {user.email} has logged out")
                raise AuthenticationFailed('User has logged out')

            logger.debug(f"Authenticated user: {user.email}")
            return user, validated_token
        except InvalidToken as e:
            logger.error(f"Invalid token: {str(e)}")
            raise AuthenticationFailed('Invalid or expired token')
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise AuthenticationFailed('Authentication failed')