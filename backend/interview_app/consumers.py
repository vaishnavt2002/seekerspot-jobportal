# interview_app/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import InterviewSchedule
from auth_app.models import JobProvider, JobSeeker
import logging

from django.conf import settings
logger = logging.getLogger(__name__)

User = get_user_model()

class InterviewConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.rooms = set()

    async def disconnect(self, close_code):
        # Leave all rooms
        for room_id in list(self.rooms):
            await self.leave_room(room_id)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'join_room':
                await self.handle_join_room(data)
            elif message_type == 'leave_room':
                await self.handle_leave_room(data)
            elif message_type in ['offer', 'answer', 'ice_candidate']:
                await self.handle_signaling(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unsupported message type: {message_type}'
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def handle_join_room(self, data):
        meeting_id = data.get('meetingId')
        user_id = data.get('userId')
        user_type = data.get('userType')

        logger.debug(f"Join room request for meeting {meeting_id} from user {user_id} ({user_type})")

        if not meeting_id or not user_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Missing meetingId or userId'
            }))
            logger.warning(f"Join room request missing meetingId or userId")
            return

        # Verify the meeting exists and user has access
        meeting_exists = await self.validate_meeting_access(meeting_id, user_id, user_type)
        if not meeting_exists:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Meeting not found or access denied'
            }))
            logger.warning(f"Access denied to meeting {meeting_id} for user {user_id}")
            return

        # Add user to the room group
        logger.debug(f"Adding user {user_id} to room group {meeting_id}")
        self.rooms.add(meeting_id)
        await self.channel_layer.group_add(
            meeting_id,
            self.channel_name
        )

        # Get user info
        user_info = await self.get_user_info(user_id)
        logger.debug(f"User info for {user_id}: {user_info}")

        # Notify the room that a user has joined
        logger.debug(f"Sending user_joined message to room {meeting_id}")
        await self.channel_layer.group_send(
            meeting_id,
            {
                'type': 'user_joined',
                'meetingId': meeting_id,
                'userId': user_id,
                'userInfo': user_info
            }
        )
        logger.debug(f"User {user_id} successfully joined meeting {meeting_id}")
    async def handle_leave_room(self, data):
        meeting_id = data.get('meetingId')
        user_id = data.get('userId')

        if not meeting_id or not user_id:
            return

        await self.leave_room(meeting_id)

        # Notify the room that a user has left
        await self.channel_layer.group_send(
            meeting_id,
            {
                'type': 'user_left',
                'meetingId': meeting_id,
                'userId': user_id
            }
        )

    async def leave_room(self, room_id):
        if room_id in self.rooms:
            self.rooms.remove(room_id)
            await self.channel_layer.group_discard(
                room_id,
                self.channel_name
            )

    async def handle_signaling(self, data):
        meeting_id = data.get('meetingId')
        if meeting_id not in self.rooms:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Not joined to this meeting room'
            }))
            logger.warning(f"User attempted to send signaling for room {meeting_id} without joining")
            return

        # Forward the signaling message to the room
        message_type = data.get('type')
        logger.debug(f"Forwarding signaling message type '{message_type}' for meeting {meeting_id}")
        
        # Add additional logging for specific signaling message types
        if message_type == 'offer':
            logger.debug(f"Forwarding OFFER from {data.get('userId')} to {data.get('targetUserId')}")
        elif message_type == 'answer':
            logger.debug(f"Forwarding ANSWER from {data.get('userId')} to {data.get('targetUserId')}")
        elif message_type == 'ice_candidate':
            logger.debug(f"Forwarding ICE candidate from {data.get('userId')}")
        
        await self.channel_layer.group_send(
            meeting_id,
            {
                'type': data.get('type'),
                **data
            }
        )
        
        logger.debug(f"Signaling message '{message_type}' sent to group {meeting_id}")


    # Methods for different message types that will be sent to clients
    async def user_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_left(self, event):
        await self.send(text_data=json.dumps(event))

    async def offer(self, event):
        await self.send(text_data=json.dumps(event))

    async def answer(self, event):
        await self.send(text_data=json.dumps(event))

    async def ice_candidate(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def validate_meeting_access(self, meeting_id, user_id, user_type):
        logger.debug(f"Validating meeting access: User {user_id} ({user_type}) " 
                    f"for meeting {meeting_id}")
        
        if settings.DEBUG and hasattr(settings, 'ALLOW_ALL_MEETING_ACCESS') and settings.ALLOW_ALL_MEETING_ACCESS:
            logger.warning(f"DEBUG MODE: Allowing all meeting access for user {user_id}")
            return True
            
        try:
            user = User.objects.get(id=user_id)
            interview = InterviewSchedule.objects.get(meeting_id=meeting_id)
            
            # Check if the meeting is active
            if interview.status not in ['SCHEDULED', 'RESCHEDULED']:
                return False
            
            # Check if user has access based on their role
            if user_type == 'job_provider':
                try:
                    job_provider = JobProvider.objects.get(user=user)
                    return interview.application.jobpost.job_provider.id == job_provider.id
                except JobProvider.DoesNotExist:
                    return False
            elif user_type == 'job_seeker':
                try:
                    job_seeker = JobSeeker.objects.get(user=user)
                    return interview.application.job_seeker.id == job_seeker.id
                except JobSeeker.DoesNotExist:
                    return False
            
            return False
        except (User.DoesNotExist, InterviewSchedule.DoesNotExist):
            return False

    @database_sync_to_async
    def get_user_info(self, user_id):
        try:
            user = User.objects.get(id=user_id)
            name = f"{user.first_name} {user.last_name}".strip()
            
            if not name:
                if user.user_type == 'job_provider':
                    try:
                        job_provider = JobProvider.objects.get(user=user)
                        name = job_provider.company_name
                    except JobProvider.DoesNotExist:
                        name = "Job Provider"
                else:
                    name = "Job Seeker"
            
            return {
                'id': user.id,
                'name': name,
                'email': user.email,
                'user_type': user.user_type,
            }
        except User.DoesNotExist:
            return None
        
