from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Community, CommunityMember, CommunityMessage
from .serializer import CommunitySerializer, CommunityMemberSerializer, CommunityMessageSerializer
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging
from .utils import get_attachment_type

# Set up logging
logger = logging.getLogger(__name__)

class IsAdminOrAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type == 'admin' or request.method in permissions.SAFE_METHODS
        )

class CommunityListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        communities = Community.objects.all()
        serializer = CommunitySerializer(communities, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = CommunitySerializer(data=request.data)
        if serializer.is_valid():
            community = serializer.save(created_by=request.user)
            # Automatically add the creator as a member
            CommunityMember.objects.get_or_create(community=community, user=request.user)
            logger.info("Community created and user %s added as member: %s", request.user.username, community.name)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.warning("Invalid community data: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommunityDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
            serializer = CommunitySerializer(community)
            
            # Check if user is a member
            is_member = False
            if request.user.is_authenticated:
                is_member = CommunityMember.objects.filter(
                    community=community, 
                    user=request.user
                ).exists()
            
            data = serializer.data
            data['is_member'] = is_member
            
            return Response(data)
        except Community.DoesNotExist:
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)

class CommunityJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
            user = request.user
            if user.user_type not in ['job_seeker', 'job_provider']:
                return Response(
                    {'error': 'Only job seekers and job providers can join communities.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            member, created = CommunityMember.objects.get_or_create(community=community, user=user)
            return Response({'status': 'joined', 'created': created})
        except Community.DoesNotExist:
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)

class CommunityLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
            user = request.user
            deleted, _ = CommunityMember.objects.filter(community=community, user=user).delete()
            if deleted:
                return Response({'status': 'left'})
            else:
                return Response({'status': 'not a member'}, status=status.HTTP_400_BAD_REQUEST)
        except Community.DoesNotExist:
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)

class CommunityMemberListView(APIView):
    permission_classes = [IsAdminOrAuthenticated]

    def get(self, request):
        community_id = request.query_params.get('community', None)
        queryset = CommunityMember.objects.all()
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        
        user = request.user
        if user.user_type != 'admin':
            queryset = queryset.filter(
                Q(user=user) | Q(community__members__user=user)
            ).distinct()
            
        serializer = CommunityMemberSerializer(queryset, many=True)
        return Response(serializer.data)

class CommunityMessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        community_id = request.query_params.get('community', None)
        
        if not community_id:
            return Response(
                {'error': 'community parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        queryset = CommunityMessage.objects.filter(community_id=community_id)
        
        # If not admin, verify membership
        if user.user_type != 'admin':
            is_member = CommunityMember.objects.filter(
                community_id=community_id, 
                user=user
            ).exists()
            
            if not is_member:
                return Response(
                    {'error': 'You are not a member of this community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
        serializer = CommunityMessageSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Add the sender to the data
        data = request.data.copy()
        
        # Validate the user is a member of the community
        try:
            community_id = data.get('community')
            if not community_id:
                logger.warning("Message post request missing community_id")
                return Response(
                    {'error': 'community is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            is_member = CommunityMember.objects.filter(
                community_id=community_id, 
                user=request.user
            ).exists()
            
            if not is_member and request.user.user_type != 'admin':
                logger.warning("User %s not authorized to post in community %s", request.user.username, community_id)
                return Response(
                    {'error': 'You are not a member of this community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
            serializer = CommunityMessageSerializer(data=data)
            if serializer.is_valid():
                message = serializer.save(sender=request.user)
                logger.info("Message saved successfully: id=%s, community=%s, sender=%s", 
                           message.id, community_id, request.user.username)
                
                # Broadcast the message via WebSocket
                try:
                    channel_layer = get_channel_layer()
                    group_name = f'community_{message.community.id}'
                    attachment_url = message.attachment.url if message.attachment else None
                    attachment_type = get_attachment_type(message.attachment) if message.attachment else None
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            'type': 'chat_message',
                            'community_id': message.community.id,
                            'message': message.content,
                            'attachment': attachment_url,
                            'attachment_type': attachment_type,
                            'sender': message.sender.username,
                            'sender_id': message.sender.id,
                            'timestamp': message.created_at.isoformat(),
                            'id': message.id
                        }
                    )
                    logger.debug("Broadcasted message to group: %s", group_name)
                except Exception as e:
                    logger.error("Failed to broadcast message to WebSocket: %s", str(e))
                    # Continue with response even if broadcast fails, as message is saved
                    pass
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.warning("Invalid message data: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Community.DoesNotExist:
            logger.warning("Community not found: %s", community_id)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Unexpected error in message post: %s", str(e))
            return Response({'error': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)