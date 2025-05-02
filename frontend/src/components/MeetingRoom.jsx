// src/components/interview/MeetingRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getProfile } from '../api/authApi';
import interviewApi from '../api/interviewApi';
import InterviewWebSocketService from '../services/InterviewWebSocketService';
import { useSelector } from 'react-redux';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const interviewType = queryParams.get('type') || 'AUDIO_AND_VIDEO';
  
  const { user } = useSelector(state => state.auth);
  
  // Component state
  const [userInfo, setUserInfo] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [meetingError, setMeetingError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // WebRTC related states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // WebSocket and WebRTC status display
  const [connectionStatus, setConnectionStatus] = useState({
    websocket: 'DISCONNECTED',
    webrtc: 'DISCONNECTED',
    iceGathering: 'NEW',
    iceConnection: 'NEW'
  });
  
  // Chat related states
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Debug log state
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // WebRTC connection refs
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const dataChannelRef = useRef(null);
  const isInitiatorRef = useRef(false);
  
  // Debug logging function
  const debugLog = (message) => {
    console.log(`[Meeting] ${message}`);
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-50), `${timestamp}: ${message}`]);
  };
  
  // Initialize WebRTC configurations
  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
  };
  // Add this effect to your component
useEffect(() => {
  if (remoteStream && remoteVideoRef.current) {
    console.log('[Meeting] Setting remote stream from effect');
    remoteVideoRef.current.srcObject = remoteStream;
    
    // Ensure video plays
    remoteVideoRef.current.play().catch(e => {
      console.error('[Meeting] Error auto-playing video:', e);
      // Some browsers require user interaction before playing video
      debugLog('Video autoplay failed. May require user interaction.');
    });
  }
}, [remoteStream]);
// Add this function to your component
const retryConnection = () => {
  debugLog('Attempting connection retry...');
  
  // Only try to reconnect if we have a peer but no connection
  if (peerInfo && !isConnected) {
    if (isInitiatorRef.current) {
      debugLog('Retrying as initiator');
      restartPeerConnection();
    } else {
      debugLog('Reconnecting signaling as non-initiator');
      reconnectSignaling();
    }
  }
};

useEffect(() => {
  if (peerInfo && !isConnected) {
    const retryTimer = setTimeout(() => {
      retryConnection();
    }, 10000); // Try every 10 seconds
    
    return () => clearTimeout(retryTimer);
  }
}, [peerInfo, isConnected]);
  // Periodically check connection status
  useEffect(() => {
    if (!isLoading) {
      const statusInterval = setInterval(() => {
        const wsStatus = InterviewWebSocketService.getStatus();
        
        let iceGatheringStatus = 'NEW';
        let iceConnectionStatus = 'NEW';
        let rtcStatus = 'DISCONNECTED';
        
        if (peerConnectionRef.current) {
          iceGatheringStatus = peerConnectionRef.current.iceGatheringState;
          iceConnectionStatus = peerConnectionRef.current.iceConnectionState;
          rtcStatus = peerConnectionRef.current.connectionState || peerConnectionRef.current.iceConnectionState;
        }
        
        setConnectionStatus({
          websocket: wsStatus,
          webrtc: rtcStatus,
          iceGathering: iceGatheringStatus,
          iceConnection: iceConnectionStatus
        });
      }, 1000);
      
      return () => clearInterval(statusInterval);
    }
  }, [isLoading]);
  
  useEffect(() => {
    // Function to fetch user info and meeting details
    const initializeMeeting = async () => {
      try {
        setIsLoading(true);
        debugLog('Initializing meeting...');
        
        // First check if we have a user from Redux
        if (!user) {
          setMeetingError('User information not available. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        debugLog(`Current user from Redux: ${user.id} - ${user.user_type}`);
        
        // Fetch meeting details
        debugLog(`Fetching meeting details for meeting ID: ${meetingId}`);
        const meetingResponse = await interviewApi.getMeetingDetails(meetingId);
        setInterviewDetails(meetingResponse);
        debugLog('Meeting details received successfully');
        
        // Fetch full profile info
        const profileResponse = await getProfile();
        setUserInfo(profileResponse);
        debugLog('User profile information received');
        
        // Set initiator flag based on user type (job provider initiates the call)
        isInitiatorRef.current = user.user_type === 'job_provider';
        debugLog(`User role: ${user.user_type}, Is call initiator: ${isInitiatorRef.current ? 'YES' : 'NO'}`);
        
        // Connect to WebSocket for signaling
        debugLog('Connecting to WebSocket signaling server...');
        await InterviewWebSocketService.connect();
        
        // Set message handler
        InterviewWebSocketService.onMessage((message) => {
          try {
            handleSignalingMessage(message);
          } catch (error) {
            console.error('Error in signaling message handler:', error);
            debugLog(`Error handling signaling message: ${error.message}`);
          }
        });
        
        // Initialize media based on interview type
        debugLog(`Setting up media with type: ${interviewType}`);
        await setupLocalMedia();
        
        // Send a join room message
        if (InterviewWebSocketService.getStatus() === 'CONNECTED') {
          debugLog('Sending join room message');
          InterviewWebSocketService.sendMessage({
            type: 'join_room',
            meetingId,
            userId: user.id,
            userType: user.user_type,
          });
        } else {
          debugLog('WebSocket not connected, will retry join room');
          // Try joining room again after a delay
          setTimeout(() => {
            if (InterviewWebSocketService.getStatus() === 'CONNECTED') {
              debugLog('Retrying join room message');
              InterviewWebSocketService.sendMessage({
                type: 'join_room',
                meetingId,
                userId: user.id,
                userType: user.user_type,
              });
            }
          }, 2000);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize meeting:', error);
        const errorMessage = error.message || error.response?.data?.error || 'Failed to initialize meeting. Please try again.';
        setMeetingError(errorMessage);
        debugLog(`Error initializing meeting: ${errorMessage}`);
        setIsLoading(false);
      }
    };
    
    initializeMeeting();
    
    // Cleanup function
    return () => {
      cleanupMeeting();
    };
  }, [meetingId, interviewType, user]);
  

const setupLocalMedia = async () => {
  try {
    console.log('[Meeting] Getting user media...');

    // If we already have a valid local stream, reuse it
    if (localStream && localStream.getTracks().length > 0 && localStream.getTracks().some(track => track.enabled)) {
      console.log('[Meeting] Reusing existing local stream');
      return localStream;
    }

    // Define media constraints based on interview type
    const constraints = {
      audio: interviewType === 'AUDIO_ONLY' || interviewType === 'AUDIO_AND_VIDEO',
      video: interviewType === 'VIDEO_ONLY' || interviewType === 'AUDIO_AND_VIDEO' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      } : false,
    };

    console.log(`[Meeting] Media constraints: ${JSON.stringify(constraints)}`);

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Enable all tracks
    stream.getTracks().forEach(track => {
      track.enabled = true;
      console.log(`[Meeting] Track: ${track.kind}, enabled: ${track.enabled}`);
    });

    console.log(`[Meeting] Got local stream with ${stream.getTracks().length} tracks`);

    // Update state
    setLocalStream(stream);

    // Attach to local video element
    if (localVideoRef.current && stream.getVideoTracks().length > 0) {
      console.log('[Meeting] Setting local video stream to video element');
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  } catch (error) {
    console.error('[Meeting] Error accessing media devices:', error);
    debugLog(`Media access error: ${error.message}`);
    setMeetingError(`Failed to access camera/microphone: ${error.message}. Please check permissions.`);
    return null;
  }
};

// Replace the createPeerConnection function with this fixed version
const createPeerConnection = async () => {
  try {
    console.log('[Meeting] Creating peer connection with ICE servers');

    // Clean up any existing connection
    if (peerConnectionRef.current) {
      console.log('[Meeting] Cleaning up existing peer connection');
      cleanupPeer();
    }

    const peerConnection = new RTCPeerConnection(servers);

    // Ensure local media stream is available
    let stream = localStream;
    if (!stream || stream.getTracks().length === 0) {
      console.log('[Meeting] No local stream available - getting user media');
      stream = await setupLocalMedia();
      if (!stream) {
        throw new Error('Failed to get local media stream');
      }
    }

    // Add local tracks
    console.log(`[Meeting] Adding ${stream.getTracks().length} local tracks to peer connection`);
    stream.getTracks().forEach(track => {
      const sender = peerConnection.addTrack(track, stream);
      console.log(`[Meeting] Added ${track.kind} track: enabled=${track.enabled}`);
    });

    // Handle remote stream
peerConnection.ontrack = (event) => {
  console.log(`[Meeting] Received remote track: ${event.track.kind}`);
  debugLog(`Received remote ${event.track.kind} track`);
  
  if (event.streams && event.streams[0]) {
    console.log(`[Meeting] Setting remote stream with ${event.streams[0].getTracks().length} tracks`);
    
    // Store the stream in state
    setRemoteStream(event.streams[0]);
    
    // Create a more robust attachment to the video element
    const videoElement = remoteVideoRef.current;
    if (videoElement) {
      console.log('[Meeting] Setting remote stream to video element');
      videoElement.srcObject = event.streams[0];
      
      // Force play the video with user interaction fallback
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('[Meeting] Error playing remote video:', e);
          debugLog('Video autoplay failed. May require user interaction.');
          
          const playButton = document.createElement('button');
          playButton.textContent = 'Click to Start Video';
          playButton.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg z-20';
          playButton.onclick = () => {
            videoElement.play();
            playButton.remove();
          };
          videoElement.parentNode.appendChild(playButton);
        });
      }
    } else {
      console.error('[Meeting] Remote video ref not available');
      debugLog('Remote video element not available');
    }
  } else {
    console.error('[Meeting] Received track, but no stream available');
    debugLog('Received track without stream');
  }
};
    // ICE candidate handling
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('[Meeting] Generated ICE candidate');
    // Make sure to include targetUserId when sending ICE candidates
    InterviewWebSocketService.sendMessage({
      type: 'ice_candidate',
      meetingId,
      candidate: event.candidate,
      userId: user?.id,
      targetUserId: peerInfo?.id,
    });
  } else {
    console.log('[Meeting] ICE candidate generation complete (null candidate)');
  }
};
    // ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`[Meeting] ICE connection state changed: ${peerConnection.iceConnectionState}`);
      if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
        console.log('[Meeting] WebRTC connection established successfully!');
        setIsConnected(true);
      } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.iceConnectionState)) {
        console.log(`[Meeting] WebRTC connection lost: ${peerConnection.iceConnectionState}`);
        setIsConnected(false);
      }
    };

    // Connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`[Meeting] Connection state changed: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'connected') {
        console.log('[Meeting] Peer connection is fully connected');
        setIsConnected(true);
      } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
        console.log(`[Meeting] Peer connection state: ${peerConnection.connectionState}`);
        setIsConnected(false);
      }
    };

    // Setup data channel for initiator
    if (isInitiatorRef.current) {
      console.log('[Meeting] Creating data channel as initiator');
      const dataChannel = peerConnection.createDataChannel('chat', { ordered: true });
      setupDataChannel(dataChannel);
    }

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      console.log(`[Meeting] Received data channel: ${event.channel.label}`);
      setupDataChannel(event.channel);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  } catch (error) {
    console.error('[Meeting] Error creating peer connection:', error);
    debugLog(`Error creating peer connection: ${error.message}`);
    throw error;
  }
};
  
  // Setup data channel
  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      debugLog(`Data channel opened: ${channel.label}`);
    };
    
    channel.onclose = () => {
      debugLog(`Data channel closed: ${channel.label}`);
    };
    
    channel.onerror = (error) => {
      console.error("Data channel error:", error);
      debugLog(`Data channel error: ${error}`);
    };
    
    channel.onmessage = (event) => {
      try {
        debugLog(`Received data channel message`);
        const message = JSON.parse(event.data);
        if (message.type === 'chat') {
          setChatMessages(prev => [...prev, message]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        debugLog(`Error parsing data channel message: ${error.message}`);
      }
    };
    
    dataChannelRef.current = channel;
  };
  




const handleSignalingMessage = async (message) => {
  if (!message || message.meetingId !== meetingId) return;
  
  console.log(`[Meeting] Received signaling message: ${message.type}`);
  debugLog(`Received ${message.type} message from ${message.userId}`);
  
  try {
    switch (message.type) {
      case 'user_joined':
        if (message.userId !== user?.id) {
          console.log(`[Meeting] User joined: ${message.userInfo?.name || message.userId}`);
          setPeerInfo(message.userInfo || { id: message.userId });
          
          // Only the initiator (job provider) should create and send an offer
          if (isInitiatorRef.current) {
            console.log('[Meeting] We are the initiator - creating offer');
            debugLog('Creating offer as initiator');
            
            try {
              // Close any existing connection before creating a new one
              if (peerConnectionRef.current) {
                cleanupPeer();
              }
              
              // Create new peer connection for the offer
              const peerConnection = await createPeerConnection();
              
              // Add a longer delay to ensure tracks are properly added
              setTimeout(async () => {
                try {
                  if (peerConnection.signalingState !== 'closed') {
                    const offer = await peerConnection.createOffer({
                      offerToReceiveAudio: true,
                      offerToReceiveVideo: true
                    });
                    
                    await peerConnection.setLocalDescription(offer);
                    
                    // Send offer with correct target user ID
                    InterviewWebSocketService.sendMessage({
                      type: 'offer',
                      meetingId,
                      offer: peerConnection.localDescription,
                      userId: user?.id,
                      targetUserId: message.userId,
                    });
                    debugLog(`Sent offer to ${message.userId}`);
                  } else {
                    debugLog('Peer connection closed before sending offer');
                  }
                } catch (error) {
                  console.error('[Meeting] Error creating/sending offer:', error);
                  debugLog(`Error creating/sending offer: ${error.message}`);
                }
              }, 2000); // Increased delay for better stability
            } catch (error) {
              console.error('[Meeting] Error in initiator setup:', error);
              debugLog(`Error in initiator setup: ${error.message}`);
            }
          } else {
            console.log('[Meeting] We are NOT the initiator - waiting for offer');
            debugLog('Not initiator - waiting for offer');
          }
        }
        break;        
      case 'offer':
        if (message.targetUserId === user?.id) {
          console.log(`[Meeting] Received offer from: ${message.userId}`);
          
          try {
            // Clean up any existing connection before creating a new one
            if (peerConnectionRef.current) {
              cleanupPeer();
            }
            
            // Create a fresh peer connection
            const peerConnection = await createPeerConnection();
            
            console.log('[Meeting] Setting remote description (offer)');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            
            console.log('[Meeting] Creating answer');
            const answer = await peerConnection.createAnswer();
            
            console.log('[Meeting] Setting local description (answer)');
            await peerConnection.setLocalDescription(answer);
            
            console.log('[Meeting] Sending answer');
            InterviewWebSocketService.sendMessage({
              type: 'answer',
              meetingId,
              answer: peerConnection.localDescription,
              userId: user?.id,
              targetUserId: message.userId,
            });
          } catch (error) {
            console.error("[Meeting] Error handling offer:", error);
          }
        }
        break;
      
      case 'answer':
        if (message.targetUserId === user?.id && peerConnectionRef.current) {
          console.log(`[Meeting] Received answer from: ${message.userId}`);
          try {
            // Only set remote description if we're in the right state
            if (peerConnectionRef.current.signalingState === 'have-local-offer') {
              console.log('[Meeting] Setting remote description (answer)');
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(message.answer)
              );
              console.log('[Meeting] Successfully set remote description');
            } else {
              console.log(`[Meeting] Cannot set remote description in current state: ${peerConnectionRef.current.signalingState}`);
            }
          } catch (error) {
            console.error("[Meeting] Error setting remote description:", error);
          }
        }
        break;
        
      case 'ice_candidate':
        // Only process ICE candidates meant for us
        if (peerConnectionRef.current && (!message.targetUserId || message.targetUserId === user?.id)) {
          try {
            console.log('[Meeting] Adding received ICE candidate');
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            );
          } catch (error) {
            console.error('[Meeting] Error adding received ICE candidate:', error);
          }
        }
        break;
        
      case 'user_left':
        if (message.userId !== user?.id) {
          console.log(`[Meeting] User left: ${message.userId}`);
          cleanupPeer();
          setPeerInfo(null);
          setRemoteStream(null);
          setIsConnected(false);
        }
        break;
        
      case 'error':
        console.error('WebSocket error:', message.message);
        setMeetingError(message.message);
        break;
    }
  } catch (error) {
    console.error('Error handling signaling message:', error);
  }
};
  
  // Clean up peer connection
  const cleanupPeer = () => {
    debugLog('Cleaning up peer connection');
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
        debugLog('Data channel closed');
      } catch (e) {
        console.error("Error closing data channel:", e);
        debugLog(`Error closing data channel: ${e.message}`);
      }
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
        debugLog('Peer connection closed');
      } catch (e) {
        console.error("Error closing peer connection:", e);
        debugLog(`Error closing peer connection: ${e.message}`);
      }
      peerConnectionRef.current = null;
    }
  };
  
  // Clean up the entire meeting
  const cleanupMeeting = () => {
    debugLog('Cleaning up meeting');
    
    // Close media streams
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          track.stop();
          debugLog(`Stopped track: ${track.kind}`);
        } catch (e) {
          console.error("Error stopping track:", e);
          debugLog(`Error stopping track: ${e.message}`);
        }
      });
    }
    
    // Close peer connection
    cleanupPeer();
    
    // Disconnect from WebSocket room
    if (user?.id) {
      try {
        debugLog('Sending leave room message');
        InterviewWebSocketService.sendMessage({
          type: 'leave_room',
          meetingId,
          userId: user.id,
        });
      } catch (e) {
        console.error("Error sending leave room message:", e);
        debugLog(`Error sending leave room message: ${e.message}`);
      }
    }
  };
  
  // Handle audio mute/unmute
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMuteState = !isAudioMuted;
        audioTracks[0].enabled = !newMuteState;
        setIsAudioMuted(newMuteState);
        
        debugLog(`Audio ${newMuteState ? 'muted' : 'unmuted'}`);
      } else {
        debugLog('No audio tracks available to mute/unmute');
      }
    }
  };
  
  // Handle video on/off
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newVideoState = !isVideoOff;
        videoTracks[0].enabled = !newVideoState;
        setIsVideoOff(newVideoState);
        
        debugLog(`Video ${newVideoState ? 'disabled' : 'enabled'}`);
      } else {
        debugLog('No video tracks available to toggle');
      }
    }
  };
  
  // End the meeting
  const endMeeting = () => {
    debugLog('End meeting button clicked');
    cleanupMeeting();
    navigate(-1); 
  };
  
  // Send a chat message
  const sendChatMessage = () => {
    if (!messageInput.trim() || !dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      debugLog('Cannot send chat message: data channel not ready or message empty');
      return;
    }
    
    const message = {
      type: 'chat',
      userId: user?.id,
      userName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You',
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
    };
    
    try {
      dataChannelRef.current.send(JSON.stringify(message));
      setChatMessages(prev => [...prev, message]);
      setMessageInput('');
      debugLog(`Sent chat message`);
    } catch (error) {
      console.error("Error sending chat message:", error);
      debugLog(`Error sending chat message: ${error.message}`);
    }
  };
  
  // Force reconnection of signaling
  const reconnectSignaling = async () => {
    debugLog('Manual reconnection requested');
    InterviewWebSocketService.disconnect();
    await InterviewWebSocketService.connect();
    
    // Re-join the room after reconnection
    setTimeout(() => {
      if (InterviewWebSocketService.getStatus() === 'CONNECTED' && user?.id) {
        debugLog('Re-joining room after manual reconnection');
        InterviewWebSocketService.sendMessage({
          type: 'join_room',
          meetingId,
          userId: user.id,
          userType: user.user_type,
        });
      }
    }, 1000);
  };
  
  // Restart peer connection
  const restartPeerConnection = async () => {
    debugLog('Restarting peer connection');
    cleanupPeer();
    
    if (isInitiatorRef.current && peerInfo?.id) {
      debugLog('Creating new offer as initiator');
      const peerConnection = await createPeerConnection();
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      
      InterviewWebSocketService.sendMessage({
        type: 'offer',
        meetingId,
        offer: peerConnection.localDescription,
        userId: user?.id,
        targetUserId: peerInfo.id,
      });
    } else {
      debugLog('Waiting for new offer as receiver');
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg">Setting up your meeting...</p>
      </div>
    );
  }
  
  // Render error state
  if (meetingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{meetingError}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Interview Meeting</h1>
            <p className="text-sm text-gray-600">
              {interviewDetails?.job_title} - Meeting ID: {meetingId}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              connectionStatus.websocket === 'CONNECTED' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              WebSocket: {connectionStatus.websocket}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isConnected
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isConnected ? 'Connected' : 'Waiting for participant...'}
            </div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isChatOpen ? 'Hide Chat' : 'Show Chat'}
            </button>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className={`flex-1 bg-gray-900 flex flex-col ${isChatOpen ? 'w-3/4' : 'w-full'}`}>

          <div className="relative flex-1 flex justify-center items-center">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{backgroundColor: 'black'}} // Add background color to make it visible
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl">👤</span>
                    </div>
                    <p className="text-xl">Waiting for the other participant...</p>
                    <p className="text-sm text-gray-400 mt-4">
                      WebSocket: {connectionStatus.websocket} | WebRTC: {connectionStatus.webrtc}
                    </p>
                    <p className="text-sm text-gray-400">
                      ICE Gathering: {connectionStatus.iceGathering} | ICE Connection: {connectionStatus.iceConnection}
                    </p>
                  </div>
                )}
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden shadow-lg">
              {localStream && (interviewType === 'VIDEO_ONLY' || interviewType === 'AUDIO_AND_VIDEO') ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white">You</span>
                  </div>
                </div>
              )}
              
              {isAudioMuted && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Muted
                </div>
              )}
              
              {isVideoOff && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Video Off
                </div>
              )}
            </div>
            
            {/* Debug log panel */}
            {showDebug && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded p-2 text-white text-xs w-96 max-h-80 overflow-y-auto">
                <div className="flex justify-between mb-1">
                  <p className="font-bold">Debug Logs:</p>
                  <button 
                    onClick={() => setShowDebug(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="border-t border-gray-700 pt-1 mt-1">
                  {debugLogs.length === 0 ? (
                    <p className="text-gray-400 italic">No logs yet</p>
                  ) : (
                    debugLogs.map((log, i) => (
                      <div key={i} className="mb-1 text-gray-300 border-b border-gray-800 pb-1">{log}</div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          {/* Controls */}
                <div className="bg-gray-800 p-4 flex justify-center items-center space-x-6 sticky bottom-0 z-10">
                  {(interviewType === 'AUDIO_ONLY' || interviewType === 'AUDIO_AND_VIDEO') && (
                    <button
                      onClick={toggleAudio}
                      className={`flex flex-col items-center justify-center p-3 rounded-full ${
                        isAudioMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'
                      } hover:scale-110 transition-transform`}
                    >
                      <span className="text-xl">{isAudioMuted ? '🔇' : '🔊'}</span>
                      <span className="text-xs mt-1">{isAudioMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                  )}

                  {(interviewType === 'VIDEO_ONLY' || interviewType === 'AUDIO_AND_VIDEO') && (
                    <button
                      onClick={toggleVideo}
                      className={`flex flex-col items-center justify-center p-3 rounded-full ${
                        isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'
                      } hover:scale-110 transition-transform`}
                    >
                      <span className="text-xl">{isVideoOff ? '🚫' : '📹'}</span>
                      <span className="text-xs mt-1">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
                    </button>
                  )}

                  <button
                    onClick={endMeeting}
                    className="flex flex-col items-center justify-center p-3 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-110 transition-transform"
                  >
                    <span className="text-xl">📞</span>
                    <span className="text-xs mt-1">End Call</span>
                  </button>
                  <button
                        onClick={restartPeerConnection}
                        className="flex flex-col items-center justify-center p-3 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-110 transition-transform"
                        title="Force reconnection attempt"
                      >
                        <span className="text-xl">🔄</span>
                        <span className="text-xs mt-1">Reconnect</span>
                      </button>
                </div>

        </div>
        
        {/* Chat area */}
        {isChatOpen && (
          <div className="w-1/4 bg-white border-l flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Meeting Chat</h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500 italic">No messages yet</p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`${
                      msg.userId === user?.id 
                        ? 'ml-auto bg-blue-100' 
                        : 'mr-auto bg-gray-100'
                    } rounded-lg p-3 max-w-xs`}
                  >
                    <p className="text-xs text-gray-600 mb-1">{msg.userName}</p>
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            {/* Input area */}
            <div className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;