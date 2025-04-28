import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import WebSocketService from '../../services/websocket';
import { useSelector } from 'react-redux';

const CommunityChat = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { communityId } = useParams();
    const [community, setCommunity] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wsStatus, setWsStatus] = useState('DISCONNECTED');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/community/${communityId}/chat` } });
            return;
        }

        // Clean up on unmount
        return () => {
            WebSocketService.disconnect();
        };
    }, [isAuthenticated, communityId, navigate]);

    useEffect(() => {
        const fetchCommunityDetails = async () => {
            try {
                const response = await axiosInstance.get(`/community/communities/${communityId}/`);
                setCommunity(response);
                return response;
            } catch (err) {
                console.error("Error fetching community details:", err);
                setError(err.message || 'Failed to fetch community details');
                return null;
            }
        };

        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/community/messages/?community=${communityId}`);
                setMessages(response || []);
            } catch (err) {
                console.error("Error fetching messages:", err);
                setError(err.message || 'Failed to fetch messages');
            } finally {
                setLoading(false);
            }
        };

        const initChat = async () => {
            if (!isAuthenticated) {
                return;
            }
        
            // First fetch community details
            const communityData = await fetchCommunityDetails();
            if (!communityData) return;
            
            // Then fetch messages
            await fetchMessages();
            
            // Only connect to WebSocket if user is a member or admin
            if (communityData.is_member || user.user_type === 'admin') {
                try {
                    // Disconnect any existing connections
                    WebSocketService.disconnect();
                    
                    // Set up status check interval
                    const statusInterval = setInterval(() => {
                        setWsStatus(WebSocketService.getStatus());
                    }, 2000);
                    
                    // Connect to WebSocket
                    await WebSocketService.connect(communityId);
                    
                    WebSocketService.onMessage((data) => {
                        if (data.error) {
                            console.error("WebSocket error:", data.error);
                            setError(data.error);
                            return;
                        }
                        
                        if (data.type === 'connection_established') {
                            console.log("WebSocket connection established:", data.message);
                            return;
                        }
                        
                        setMessages((prev) => {
                            // Check if message already exists to avoid duplicates
                            const exists = prev.some(msg => 
                                msg.id === data.id || 
                                (msg.content === data.content && msg.sender === data.sender && 
                                 msg.timestamp === data.timestamp)
                            );
                            
                            if (exists) return prev;
                            
                            // Add new message and sort by timestamp
                            return [...prev, data].sort((a, b) => 
                                new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)
                            );
                        });
                    });
                    
                    return () => {
                        clearInterval(statusInterval);
                        WebSocketService.disconnect();
                    };
                } catch (wsError) {
                    console.error("WebSocket connection error:", wsError);
                    setError("Chat connection failed. Please try refreshing the page.");
                }
            } else {
                setError('You must join this community to view messages');
            }
        };
        
        initChat();
    }, [communityId, isAuthenticated, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File size must be less than 10MB');
                return;
            }
            setAttachment(file);
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setAttachmentPreview(e.target.result);
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreview(null);
            }
        }
    };

    const clearAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !attachment) return;

        try {
            if (attachment) {
                const formData = new FormData();
                formData.append('community', communityId);
                formData.append('content', newMessage);
                formData.append('attachment', attachment);
                
                const response = await axiosInstance.post('/community/messages/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                setMessages((prev) => [...prev, response].sort((a, b) => 
                    new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)
                ));
            } else {
                // Check if WebSocket is connected
                if (WebSocketService.getStatus() !== 'CONNECTED') {
                    alert('Connection to chat server lost. Reconnecting...');
                    await WebSocketService.connect(communityId);
                    return;
                }
                
                // For text messages, use the WebSocket
                WebSocketService.sendMessage(newMessage);
            }
            
            setNewMessage('');
            clearAttachment();
        } catch (err) {
            console.error("Error sending message:", err);
            alert('Failed to send message: ' + (err.message || 'Unknown error'));
        }
    };

    if (!isAuthenticated) {
        return <div className="text-center py-10">Please log in to view this community.</div>;
    }

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Chat: {community?.name || 'Loading...'}</h2>
            <div className="bg-white shadow-md rounded-lg">
                {wsStatus !== 'CONNECTED' && (
                    <div className="bg-yellow-100 p-2 text-yellow-800 text-center">
                        Chat status: {wsStatus} {wsStatus !== 'CONNECTED' && '- Reconnecting...'}
                    </div>
                )}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={msg.id || index}
                                className={`flex ${
                                    msg.sender === user.username ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`max-w-xs p-3 rounded-lg ${
                                        msg.sender === user.username
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}
                                >
                                    <p className="text-sm font-semibold">{msg.sender}</p>
                                    <p>{msg.content}</p>
                                    {msg.attachment && (
                                        <div className="mt-2">
                                            {msg.attachment.match(/\.(jpg|jpeg|png)$/i) ? (
                                                <img
                                                    src={msg.attachment}
                                                    alt="attachment"
                                                    className="max-w-full rounded"
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-image.jpg';
                                                    }}
                                                />
                                            ) : msg.attachment.endsWith('.pdf') ? (
                                                <a
                                                    href={msg.attachment}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-300 hover:underline"
                                                >
                                                    View PDF
                                                </a>
                                            ) : (
                                                <a
                                                    href={msg.attachment}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-300 hover:underline"
                                                >
                                                    Download Attachment
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs mt-1 opacity-70">
                                        {new Date(msg.timestamp || msg.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t">
                    {attachmentPreview && (
                        <div className="mb-2 relative">
                            <img 
                                src={attachmentPreview} 
                                alt="Preview" 
                                className="h-16 w-auto rounded"
                            />
                            <button
                                onClick={clearAttachment}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={sendMessage}
                            disabled={(!newMessage.trim() && !attachment) || wsStatus !== 'CONNECTED'}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityChat;