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
  
  // Chat related states
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Meeting ended state
  const [meetingEnded, setMeetingEnded] = useState(false);
  
  // WebRTC connection refs
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const dataChannelRef = useRef(null);
  const isInitiatorRef = useRef(false);
  
  // Helper for logging (simplified, no UI display)
  const debugLog = (message) => {
    console.log(`[Meeting] ${message}`);
  };

  // Make sure remote video display works consistently
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Use muted=true to avoid autoplay restrictions
      remoteVideoRef.current.muted = false;
      
      // Auto-play with error handling
      remoteVideoRef.current.play().catch(e => {
        console.error('[Meeting] Error auto-playing remote video:', e);
        // Instead of creating a button, we'll try playing the video automatically when possible
        const attemptPlay = () => {
          remoteVideoRef.current.play().catch(() => {
            setTimeout(attemptPlay, 1000); // Retry every second
          });
        };
        attemptPlay();
      });
    }
  }, [remoteStream]);

  // Make sure local video display works consistently
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      
      // Use muted=true for local video to avoid feedback
      localVideoRef.current.muted = true;
      
      // Auto-play with error handling
      localVideoRef.current.play().catch(e => {
        console.error('[Meeting] Error auto-playing local video:', e);
        const attemptPlay = () => {
          localVideoRef.current.play().catch(() => {
            setTimeout(attemptPlay, 1000); // Retry every second
          });
        };
        attemptPlay();
      });
    }
  }, [localStream]);

  const retryConnection = () => {
    if (peerInfo && !isConnected) {
      if (isInitiatorRef.current) {
        restartPeerConnection();
      } else {
        reconnectSignaling();
      }
    }
  };

  useEffect(() => {
    if (peerInfo && !isConnected) {
      const retryTimer = setTimeout(() => {
        retryConnection();
      }, 10000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [peerInfo, isConnected]);
  
  useEffect(() => {
    // Function to fetch user info and meeting details
    const initializeMeeting = async () => {
      try {
        setIsLoading(true);
        
        // First check if we have a user from Redux
        if (!user) {
          setMeetingError('User information not available. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        // Fetch meeting details
        const meetingResponse = await interviewApi.getMeetingDetails(meetingId);
        setInterviewDetails(meetingResponse);
        
        // Fetch full profile info
        const profileResponse = await getProfile();
        setUserInfo(profileResponse);
        
        // Set initiator flag based on user type (job provider initiates the call)
        isInitiatorRef.current = user.user_type === 'job_provider';
        
        // Connect to WebSocket for signaling
        await InterviewWebSocketService.connect();
        
        // Set message handler
        InterviewWebSocketService.onMessage((message) => {
          try {
            handleSignalingMessage(message);
          } catch (error) {
            console.error('Error in signaling message handler:', error);
          }
        });
        
        // Initialize media based on interview type
        await setupLocalMedia();
        
        // Send a join room message
        if (InterviewWebSocketService.getStatus() === 'CONNECTED') {
          InterviewWebSocketService.sendMessage({
            type: 'join_room',
            meetingId,
            userId: user.id,
            userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            userType: user.user_type,
          });
        } else {
          // Try joining room again after a delay
          setTimeout(() => {
            if (InterviewWebSocketService.getStatus() === 'CONNECTED') {
              InterviewWebSocketService.sendMessage({
                type: 'join_room',
                meetingId,
                userId: user.id,
                userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
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
      // If we already have a valid local stream, reuse it
      if (localStream && localStream.getTracks().length > 0 && localStream.getTracks().some(track => track.enabled)) {
        // Make sure local video is properly displayed
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.muted = true; // Always mute local video
          localVideoRef.current.play().catch(error => {
            console.error('[Meeting] Error playing local video:', error);
          });
        }
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

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Enable all tracks
      stream.getTracks().forEach(track => {
        track.enabled = true;
      });

      // Update state
      setLocalStream(stream);

      // Attach to local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Always mute local video
        
        // Ensure the video plays with automatic retry
        const attemptPlay = () => {
          localVideoRef.current.play().catch(error => {
            console.error('[Meeting] Error playing local video:', error);
            setTimeout(attemptPlay, 1000);
          });
        };
        attemptPlay();
      }

      return stream;
    } catch (error) {
      console.error('[Meeting] Error accessing media devices:', error);
      setMeetingError(`Failed to access camera/microphone: ${error.message}. Please check permissions.`);
      return null;
    }
  };

  const createPeerConnection = async () => {
    try {
      const servers = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ],
      };

      // Clean up any existing connection
      if (peerConnectionRef.current) {
        cleanupPeer();
      }

      const peerConnection = new RTCPeerConnection(servers);

      // Ensure local media stream is available
      let stream = localStream;
      if (!stream || stream.getTracks().length === 0) {
        stream = await setupLocalMedia();
        if (!stream) {
          throw new Error('Failed to get local media stream');
        }
      }

      // Add local tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          // Store the stream in state
          setRemoteStream(event.streams[0]);
          
          // Create a more robust attachment to the video element
          const videoElement = remoteVideoRef.current;
          if (videoElement) {
            videoElement.srcObject = event.streams[0];
            videoElement.muted = false; // Ensure remote video is not muted
            
            // Auto-play with retry mechanism
            const attemptPlay = () => {
              videoElement.play().catch(e => {
                console.error('[Meeting] Error playing remote video:', e);
                setTimeout(attemptPlay, 1000);
              });
            };
            attemptPlay();
          }
          
          // Make sure local video is still properly displayed
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.muted = true; // Always mute local video
            localVideoRef.current.play().catch(e => {
              console.error('[Meeting] Error playing local video after remote connection:', e);
            });
          }
        }
      };

      // ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Make sure to include targetUserId when sending ICE candidates
          InterviewWebSocketService.sendMessage({
            type: 'ice_candidate',
            meetingId,
            candidate: event.candidate,
            userId: user?.id,
            targetUserId: peerInfo?.id,
          });
        }
      };

      // ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
          setIsConnected(true);
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.iceConnectionState)) {
          setIsConnected(false);
        }
      };

      // Connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
          setIsConnected(false);
        }
      };

      // Setup data channel for initiator
      if (isInitiatorRef.current) {
        const dataChannel = peerConnection.createDataChannel('chat', { ordered: true });
        setupDataChannel(dataChannel);
      }

      // Handle incoming data channels
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error('[Meeting] Error creating peer connection:', error);
      throw error;
    }
  };
  
  // Setup data channel
  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      console.log(`Data channel opened: ${channel.label}`);
    };
    
    channel.onclose = () => {
      console.log(`Data channel closed: ${channel.label}`);
    };
    
    channel.onerror = (error) => {
      console.error("Data channel error:", error);
    };
    
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'chat') {
          setChatMessages(prev => [...prev, message]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    dataChannelRef.current = channel;
  };

  const handleSignalingMessage = async (message) => {
    if (!message || message.meetingId !== meetingId) return;
    
    try {
      switch (message.type) {
        case 'user_joined':
          if (message.userId !== user?.id) {
            // Store peer info with name
            setPeerInfo({
              id: message.userId,
              name: message.userName || 'Participant',
              ...message.userInfo
            });
            
            if (isInitiatorRef.current) {
              try {
                if (peerConnectionRef.current) {
                  cleanupPeer();
                }
                
                
                const peerConnection = await createPeerConnection();
                
               
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
                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                        targetUserId: message.userId,
                      });
                    }
                  } catch (error) {
                    console.error('[Meeting] Error creating/sending offer:', error);
                  }
                }, 2000); // Increased delay for better stability
              } catch (error) {
                console.error('[Meeting] Error in initiator setup:', error);
              }
            }
            
            setTimeout(() => {
              if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch(e => {
                  console.error('[Meeting] Error replaying local video after peer joined:', e);
                });
              }
            }, 1000);
          }
          break;        
        case 'offer':
          if (message.targetUserId === user?.id) {
            try {
              // Store the peer's name if available
              if (message.userName) {
                setPeerInfo(prev => ({
                  ...prev,
                  id: message.userId,
                  name: message.userName
                }));
              }
              
              // Clean up any existing connection before creating a new one
              if (peerConnectionRef.current) {
                cleanupPeer();
              }
              
              // Create a fresh peer connection
              const peerConnection = await createPeerConnection();
              
              await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
              
              const answer = await peerConnection.createAnswer();
              
              await peerConnection.setLocalDescription(answer);
              
              InterviewWebSocketService.sendMessage({
                type: 'answer',
                meetingId,
                answer: peerConnection.localDescription,
                userId: user?.id,
                userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                targetUserId: message.userId,
              });
              
              // Ensure local video is still properly displayed
              setTimeout(() => {
                if (localVideoRef.current && localStream) {
                  localVideoRef.current.srcObject = localStream;
                  localVideoRef.current.muted = true;
                  localVideoRef.current.play().catch(e => {
                    console.error('[Meeting] Error replaying local video after answering:', e);
                  });
                }
              }, 1000);
            } catch (error) {
              console.error("[Meeting] Error handling offer:", error);
            }
          }
          break;
        
        case 'answer':
          if (message.targetUserId === user?.id && peerConnectionRef.current) {
            try {
      
              if (message.userName) {
                setPeerInfo(prev => ({
                  ...prev,
                  id: message.userId,
                  name: message.userName
                }));
              }
              
  
              if (peerConnectionRef.current.signalingState === 'have-local-offer') {
                await peerConnectionRef.current.setRemoteDescription(
                  new RTCSessionDescription(message.answer)
                );
                
             
                setTimeout(() => {
                  if (localVideoRef.current && localStream) {
                    localVideoRef.current.srcObject = localStream;
                    localVideoRef.current.muted = true;
                    localVideoRef.current.play().catch(e => {
                      console.error('[Meeting] Error replaying local video after answer received:', e);
                    });
                  }
                }, 1000);
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
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch (e) {
        console.error("Error closing data channel:", e);
      }
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.error("Error closing peer connection:", e);
      }
      peerConnectionRef.current = null;
    }
  };
  
  // Clean up the entire meeting
  const cleanupMeeting = () => {
    // Close media streams
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track:", e);
        }
      });
    }
    
    // Close peer connection
    cleanupPeer();
    
    // Disconnect from WebSocket room
    if (user?.id) {
      try {
        InterviewWebSocketService.sendMessage({
          type: 'leave_room',
          meetingId,
          userId: user.id,
        });
      } catch (e) {
        console.error("Error sending leave room message:", e);
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
      }
    }
  };
  
  const endMeeting = () => {
    setMeetingEnded(true);
    
    cleanupMeeting();
    
    setTimeout(() => {
      window.close();
      
      
      navigate(-1);
    }, 5000);
  };
  
  // Send a chat message
  const sendChatMessage = () => {
    if (!messageInput.trim() || !dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      return;
    }
    
    const message = {
      type: 'chat',
      userId: user?.id,
      userName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
    };
    
    try {
      dataChannelRef.current.send(JSON.stringify(message));
      setChatMessages(prev => [...prev, message]);
      setMessageInput('');
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  };
  
  const reconnectSignaling = async () => {
    InterviewWebSocketService.disconnect();
    await InterviewWebSocketService.connect();
    
    setTimeout(() => {
      if (InterviewWebSocketService.getStatus() === 'CONNECTED' && user?.id) {
        InterviewWebSocketService.sendMessage({
          type: 'join_room',
          meetingId,
          userId: user.id,
          userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          userType: user.user_type,
        });
      }
    }, 1000);
  };
  
  const restartPeerConnection = async () => {
    cleanupPeer();
    
    if (isInitiatorRef.current && peerInfo?.id) {
      const peerConnection = await createPeerConnection();
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      
      InterviewWebSocketService.sendMessage({
        type: 'offer',
        meetingId,
        offer: peerConnection.localDescription,
        userId: user?.id,
        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        targetUserId: peerInfo.id,
      });
    }
  };
  
  // Get proper display name for user
  const getUserDisplayName = () => {
    return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';
  };
  
  // Get proper display name for peer
  const getPeerDisplayName = () => {
    return peerInfo?.name || 'Participant';
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
  
  // Render meeting ended state
  if (meetingEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Meeting Ended</h2>
          <p className="text-gray-700 mb-4">Thank you for participating in this interview.</p>
          <p className="text-gray-500">This window will close automatically in a few seconds...</p>
        </div>
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
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isChatOpen ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area  */}
        <div className={`flex-1 bg-gray-900 flex flex-col relative ${isChatOpen ? 'w-3/4' : 'w-full'}`}>
          <div className="relative flex-1 flex justify-center items-center">
            {remoteStream ? (
              <div className="relative w-full h-full">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{backgroundColor: 'black'}}
                />
                
                {/* Remote participant name overlay */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg z-10">
                  {getPeerDisplayName()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">👤</span>
                </div>
                <p className="text-xl">Waiting for {peerInfo?.name || 'the other participant'}...</p>
              </div>
            )}
            
            {/* Local video  */}
            <div className="absolute top-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden shadow-lg z-10">
              {localStream && (interviewType === 'VIDEO_ONLY' || interviewType === 'AUDIO_AND_VIDEO') ? (
                <div className="relative w-full h-full">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Local user name overlay */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-0.5 rounded text-sm">
                    {getUserDisplayName()} (You)
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg text-white">You</span>
                  </div>
                  {/* Local user name overlay  */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-0.5 rounded text-sm">
                    {getUserDisplayName()} (You)
                  </div>
                </div>
              )}
              
              {isAudioMuted && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Muted
                </div>
              )}
              
              {isVideoOff && (
                <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Video Off
                </div>
              )}
            </div>
          </div>
          
          {/* Controls  */}
          <div className="bg-gray-800 p-4 flex justify-center items-center space-x-6 sticky bottom-0 z-20">
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
                    <p className="text-sm font-bold text-gray-800 mb-1 truncate max-w-full">
                      {msg.userId === user?.id ? 'You' : msg.userName}
                    </p>
                    <p className="break-words">{msg.content}</p>
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