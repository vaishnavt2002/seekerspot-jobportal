# auth_app/authentication.py

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.core.cache import cache


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')

        if not access_token:
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
            
            cache_key = f"logout_{user.id}"
            if cache.get(cache_key):
                raise AuthenticationFailed('User has logged out')

            return user, validated_token
        except InvalidToken as e:
            raise AuthenticationFailed('Invalid or expired token')
        except Exception as e:
            raise AuthenticationFailed('Authentication failed')