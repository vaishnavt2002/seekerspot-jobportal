from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import *
from .serializer import CommunitySerializer, CommunityMemberSerializer, CommunityMessageSerializer
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging
from .utils import get_attachment_type
from django.db import transaction


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
        result = []
        
        for community in communities:
            data = CommunitySerializer(community).data
            
            # Check if user is a member
            is_member = False
            unread_count = 0
            
            if request.user.is_authenticated:
                is_member = CommunityMember.objects.filter(
                    community=community, 
                    user=request.user
                ).exists()
                
                # Get unread count
                if is_member or request.user.user_type == 'admin':
                    read_status, created = UserReadStatus.objects.get_or_create(
                        user=request.user,
                        community=community
                    )
                    
                    unread_query = CommunityMessage.objects.filter(community=community)
                    if read_status.last_read_message:
                        unread_query = unread_query.filter(created_at__gt=read_status.last_read_message.created_at)
                    unread_count = unread_query.count()
                    
            data['is_member'] = is_member
            data['unread_count'] = unread_count
            result.append(data)
        
        return Response(result)
    
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
            unread_count = 0
            
            if request.user.is_authenticated:
                is_member = CommunityMember.objects.filter(
                    community=community, 
                    user=request.user
                ).exists()
                
                # Get unread count
                if is_member or request.user.user_type == 'admin':
                    read_status, created = UserReadStatus.objects.get_or_create(
                        user=request.user,
                        community=community
                    )
                    
                    unread_query = CommunityMessage.objects.filter(community=community)
                    if read_status.last_read_message:
                        unread_query = unread_query.filter(created_at__gt=read_status.last_read_message.created_at)
                    unread_count = unread_query.count()
            
            data = serializer.data
            data['is_member'] = is_member
            data['unread_count'] = unread_count
            logger.info("Successfully retrieved community details for ID %s", pk)
            return Response(data)
        except Community.DoesNotExist:
            logger.warning("Community not found: ID %s", pk)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)

class CommunityJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
            user = request.user
            if user.user_type not in ['job_seeker', 'job_provider']:
                logger.warning("User %s with type %s attempted to join community - not allowed", user.username, user.user_type)
                return Response(
                    {'error': 'Only job seekers and job providers can join communities.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            member, created = CommunityMember.objects.get_or_create(community=community, user=user)
            if created:
                logger.info("User %s joined community %s successfully", user.username, community.name)
            else:
                logger.info("User %s already member of community %s", user.username, community.name)
            return Response({'status': 'joined', 'created': created})
        except Community.DoesNotExist:
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Unexpected error during community join: %s", str(e), exc_info=True)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CommunityLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
            user = request.user
            deleted, _ = CommunityMember.objects.filter(community=community, user=user).delete()
            if deleted:
                logger.info("User %s left community %s successfully", user.username, community.name)
                return Response({'status': 'left'})
            else:
                logger.warning("User %s attempted to leave community %s but was not a member", user.username, community.name)
                return Response({'status': 'not a member'}, status=status.HTTP_400_BAD_REQUEST)
        except Community.DoesNotExist:
            logger.warning("Leave attempt failed - Community not found: ID %s", pk)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Unexpected error during community leave: %s", str(e), exc_info=True)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CommunityMemberListView(APIView):
    permission_classes = [IsAdminOrAuthenticated]

    def get(self, request):
        try:
            community_id = request.query_params.get('community', None)
            logger.debug("Fetching community members. Community ID filter: %s", community_id)
            
            queryset = CommunityMember.objects.all()
            
            if community_id:
                queryset = queryset.filter(community_id=community_id)
            
            user = request.user
            if user.user_type != 'admin':
                logger.debug("Non-admin user %s: filtering members to accessible communities", user.username)
                queryset = queryset.filter(
                    Q(user=user) | Q(community__members__user=user)
                ).distinct()
                
            serializer = CommunityMemberSerializer(queryset, many=True)
            logger.info("Successfully returned %d community members", len(serializer.data))
            return Response(serializer.data)
        except Exception as e:
            logger.error("Error fetching community members: %s", str(e), exc_info=True)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CommunityMessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            community_id = request.query_params.get('community', None)
            
            if not community_id:
                logger.warning("Message list request missing community_id param")
                return Response(
                    {'error': 'community parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            logger.debug("Fetching messages for community %s, user %s", community_id, user.username)
            queryset = CommunityMessage.objects.filter(community_id=community_id)
            
            # If not admin, verify membership
            if user.user_type != 'admin':
                is_member = CommunityMember.objects.filter(
                    community_id=community_id, 
                    user=user
                ).exists()
                
                if not is_member:
                    logger.warning("User %s attempted to access messages for community %s without membership",
                                  user.username, community_id)
                    return Response(
                        {'error': 'You are not a member of this community'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
            serializer = CommunityMessageSerializer(queryset, many=True)
            logger.info("Successfully returned %d messages for community %s", 
                       len(serializer.data), community_id)
            return Response(serializer.data)
        except Exception as e:
            logger.error("Error fetching community messages: %s", str(e), exc_info=True)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
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
            
            logger.debug("User %s attempting to post message to community %s", 
                        request.user.username, community_id)
                
            is_member = CommunityMember.objects.filter(
                community_id=community_id, 
                user=request.user
            ).exists()
            
            if not is_member and request.user.user_type != 'admin':
                logger.warning("User %s not authorized to post in community %s", 
                              request.user.username, community_id)
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
                    logger.debug("Attempting to broadcast message via WebSocket")
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
                    logger.error("Failed to broadcast message to WebSocket: %s", str(e), exc_info=True)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.warning("Invalid message data: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Community.DoesNotExist:
            logger.warning("Community not found: %s", community_id)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Unexpected error in message post: %s", str(e), exc_info=True)
            return Response({'error': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            



class MarkMessagesReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        community_id = request.data.get('community')
        message_id = request.data.get('message_id')  # The ID of the last message read
        
        if not community_id:
            return Response(
                {'error': 'community parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            community = Community.objects.get(id=community_id)
            
            is_member = CommunityMember.objects.filter(
                community=community, 
                user=request.user
            ).exists()
            
            if not is_member and request.user.user_type != 'admin':
                return Response(
                    {'error': 'You are not a member of this community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if message_id:
                try:
                    message = CommunityMessage.objects.get(id=message_id, community=community)
                except CommunityMessage.DoesNotExist:
                    return Response(
                        {'error': 'Message not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Otherwise, get the latest message
                message = CommunityMessage.objects.filter(community=community).order_by('-created_at').first()
            
            # Update or create read status
            if message:
                UserReadStatus.objects.update_or_create(
                    user=request.user,
                    community=community,
                    defaults={'last_read_message': message}
                )
                
            return Response({'status': 'marked as read'})
            
        except Community.DoesNotExist:
            logger.warning("Community not found: %s", community_id)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)

class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        result = {}
        
        if user.user_type == 'admin':
            communities = Community.objects.all()
        else:
            communities = Community.objects.filter(members__user=user)
        
        for community in communities:
            read_status = UserReadStatus.objects.filter(
                user=user,
                community=community
            ).first()
            
            if read_status and read_status.last_read_message:
                unread_count = CommunityMessage.objects.filter(
                    community=community,
                    created_at__gt=read_status.last_read_message.created_at
                ).exclude(sender=user).count() 
            else:
                unread_count = CommunityMessage.objects.filter(
                    community=community
                ).exclude(sender=user).count()
            
            result[community.id] = {
                'community_name': community.name,
                'unread_count': unread_count
            }
            
        return Response(result)

class FirstUnreadMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        community_id = request.query_params.get('community')
        
        if not community_id:
            return Response(
                {'error': 'community parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            community = Community.objects.get(id=community_id)
            
            is_member = CommunityMember.objects.filter(
                community=community, 
                user=request.user
            ).exists()
            
            if not is_member and request.user.user_type != 'admin':
                return Response(
                    {'error': 'You are not a member of this community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
            read_status = UserReadStatus.objects.filter(
                user=request.user,
                community=community
            ).first()
            
            if read_status and read_status.last_read_message:
                # Find first message after the last read
                first_unread = CommunityMessage.objects.filter(
                    community=community,
                    created_at__gt=read_status.last_read_message.created_at
                ).order_by('created_at').first()
                
                if first_unread:
                    serializer = CommunityMessageSerializer(first_unread)
                    return Response({
                        'first_unread_message': serializer.data,
                        'has_unread': True
                    })
                else:
                    return Response({'has_unread': False})
            else:
                # If no read status, the first message is the first unread
                first_message = CommunityMessage.objects.filter(
                    community=community
                ).order_by('created_at').first()
                
                if first_message:
                    serializer = CommunityMessageSerializer(first_message)
                    return Response({
                        'first_unread_message': serializer.data,
                        'has_unread': True
                    })
                else:
                    return Response({'has_unread': False})
                
        except Community.DoesNotExist:
            logger.warning("Community not found: %s", community_id)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)

class UserReadStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get read status for all communities the user is a member of"""
        user = request.user
        
        # Get all communities the user is a member of
        user_communities = Community.objects.filter(members__user=user)
        
        # Initialize result list
        result = []
        
        for community in user_communities:
            # Get or create read status
            read_status, created = UserReadStatus.objects.get_or_create(
                user=user,
                community=community
            )
            
            # Count unread messages
            last_read_msg = read_status.last_read_message
            unread_query = CommunityMessage.objects.filter(community=community)
            
            if last_read_msg:
                unread_query = unread_query.filter(created_at__gt=last_read_msg.created_at)
            
            unread_count = unread_query.count()
            
            # Add to result
            result.append({
                'id': read_status.id,
                'community': community.id,
                'community_name': community.name,
                'last_read_message': read_status.last_read_message.id if read_status.last_read_message else None,
                'last_read_time': read_status.last_read_time,
                'unread_count': unread_count
            })
        
        return Response(result)
    
    def post(self, request):
        """Mark messages as read up to a specific message"""
        user = request.user
        community_id = request.data.get('community')
        message_id = request.data.get('message_id')
        
        if not community_id:
            return Response({'error': 'community is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            community = Community.objects.get(id=community_id)
            
            # Verify user is a member of the community
            is_member = CommunityMember.objects.filter(community=community, user=user).exists()
            if not is_member and user.user_type != 'admin':
                return Response(
                    {'error': 'You are not a member of this community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # If message_id is provided, use that message
            if message_id:
                try:
                    # Validate message_id is an integer
                    try:
                        message_id = int(message_id)
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid message_id format: {message_id}, using latest message instead")
                        message = CommunityMessage.objects.filter(community=community).order_by('-created_at').first()
                    else:
                        message = CommunityMessage.objects.get(id=message_id, community=community)
                except CommunityMessage.DoesNotExist:
                    return Response(
                        {'error': 'Message not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Otherwise, use the latest message
                message = CommunityMessage.objects.filter(community=community).order_by('-created_at').first()
                    
            if message:
                with transaction.atomic():
                    read_status, created = UserReadStatus.objects.update_or_create(
                        user=user,
                        community=community,
                        defaults={'last_read_message': message}
                    )
                    
                return Response({
                    'status': 'success',
                    'community': community_id,
                    'last_read_message': message.id,
                    'last_read_time': read_status.last_read_time
                })
            else:
                return Response({
                    'status': 'no_messages',
                    'community': community_id
                })
                    
        except Community.DoesNotExist:
            logger.warning("Community not found: %s", community_id)
            return Response({'error': 'Community not found'}, status=status.HTTP_404_NOT_FOUND)