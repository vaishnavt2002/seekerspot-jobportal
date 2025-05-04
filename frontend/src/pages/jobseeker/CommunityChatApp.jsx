import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import WebSocketService from '../../services/websocket';
import { useSelector } from 'react-redux';

// Constants
const BASE_URL = 'http://127.0.0.1:8000';

// Helper Components
const FileIcon = ({ filePath }) => {
  if (!filePath) return null;
  
  if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  } else if (filePath.match(/\.(pdf)$/i)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  } else if (filePath.match(/\.(doc|docx)$/i)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  } else {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    );
  }
};

const getFileNameFromPath = (filePath) => {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1];
};

// Community List Item Component
const CommunityListItem = ({ community, isSelected, isMember, isAdmin, onSelect, onJoin }) => {
  return (
    <div
      className={`p-4 cursor-pointer hover:bg-gray-200 transition ${
        isSelected ? 'bg-gray-200' : ''
      }`}
      onClick={() => onSelect(community.id)}
    >
      <div className="flex items-center space-x-3">
        <img
          src={`${BASE_URL}${community.cover_image}` || '/placeholder-community.jpg'}
          alt={community.name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-community.jpg';
          }}
        />
        <div className="flex-1">
          <h3 className="text-base font-semibold">{community.name}</h3>
          <p className="text-sm text-gray-500 truncate">
            {community.description || 'No description'}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        {isAdmin ? (
          <span className="text-xs text-gray-500">Admin access</span>
        ) : isMember ? null : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin(community.id);
            }}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
};
// Sidebar Component
const CommunitySidebar = ({ 
  isSidebarOpen, 
  myCommunities, 
  exploreCommunities, 
  selectedCommunityId, 
  searchQuery, 
  setSearchQuery,
  setIsSidebarOpen,
  setIsCreateModalOpen,
  setSelectedCommunityId,
  filterCommunities,
  joinCommunity,
  user
}) => {
  return (
    <div
      className={`${
        isSidebarOpen ? 'block' : 'hidden'
      } md:block w-full md:w-64 lg:w-80 bg-gray-100 border-r border-gray-200 overflow-y-auto transition-all duration-300 absolute md:static z-10 md:min-h-[90vh]`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold hidden md:block">Communities</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
          >
            Create Community
          </button>
        </div>
        <input
          type="text"
          placeholder="Search communities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* My Communities */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">My Communities</h3>
        {filterCommunities(myCommunities).length === 0 ? (
          <div className="text-center text-gray-500 py-2">No communities joined.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filterCommunities(myCommunities).map((community) => (
              <CommunityListItem
                key={community.id}
                community={community}
                isSelected={selectedCommunityId === community.id}
                isMember={true}
                isAdmin={user.user_type === 'admin'}
                onSelect={() => {
                  setSelectedCommunityId(community.id);
                  setIsSidebarOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Explore Communities */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Explore</h3>
        {filterCommunities(exploreCommunities).length === 0 ? (
          <div className="text-center text-gray-500 py-2">No communities to explore.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filterCommunities(exploreCommunities).map((community) => (
              <CommunityListItem
                key={community.id}
                community={community}
                isSelected={selectedCommunityId === community.id}
                isMember={false}
                isAdmin={false}
                onSelect={() => {
                  setSelectedCommunityId(community.id);
                  setIsSidebarOpen(false);
                }}
                onJoin={joinCommunity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Message Component
const ChatMessage = ({ message, openImageModal, isOwnMessage }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] sm:max-w-xs md:max-w-md p-3 rounded-lg ${
          isOwnMessage
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800 shadow'
        }`}
      >
        <p className="text-sm font-semibold">{message.sender}</p>
        <p>{message.content}</p>
        {message.attachment && (
          <div className="mt-2">
            {message.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <div
                className="cursor-pointer"
                onClick={() => openImageModal(`${BASE_URL}${message.attachment}`)}
              >
                <img
                  src={`${BASE_URL}${message.attachment}`}
                  alt="attachment"
                  className="max-w-full rounded hover:opacity-90 transition"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                <p className="text-xs mt-1 opacity-70 text-center">Click to enlarge</p>
              </div>
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-gray-100 bg-opacity-30 rounded">
                <div className="text-white">
                  <FileIcon filePath={message.attachment} />
                </div>
                <a
                  href={`${BASE_URL}${message.attachment}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    isOwnMessage ? 'text-white' : 'text-blue-600'
                  } hover:underline text-sm flex-1 truncate`}
                >
                  {getFileNameFromPath(message.attachment)}
                </a>
              </div>
            )}
          </div>
        )}
        <p className="text-xs mt-1 opacity-70">
          {new Date(message.timestamp || message.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ community, wsStatus, selectedCommunityId, userMemberships, leaveCommunity, user }) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center space-x-3">
        <img
          src={`${BASE_URL}${community?.cover_image}` || '/placeholder-community.jpg'}
          alt={community?.name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-community.jpg';
          }}
        />
        <h2 className="text-xl font-bold">{community?.name || 'Loading...'}</h2>
      </div>
      <div className="flex items-center space-x-2">
        {wsStatus !== 'CONNECTED' && (
          <span className="text-xs sm:text-sm text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
            {wsStatus} - Reconnecting...
          </span>
        )}
        {userMemberships[selectedCommunityId] && user.user_type !== 'admin' && (
          <button
            onClick={() => leaveCommunity(selectedCommunityId)}
            className="text-xs sm:text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Leave
          </button>
        )}
      </div>
    </div>
  );
};

// Chat Input Component
const ChatInput = ({ 
  newMessage, 
  setNewMessage, 
  attachment, 
  attachmentPreview, 
  selectedFileName,
  clearAttachment, 
  handleFileChange, 
  sendMessage, 
  wsStatus 
}) => {
  return (
    <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
      {(attachmentPreview || selectedFileName) && (
        <div className="mb-2 flex items-center">
          {attachmentPreview ? (
            <div className="relative inline-block">
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
          ) : (
            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg flex items-center space-x-2">
              <FileIcon filePath={selectedFileName} />
              <span className="text-sm font-medium">{selectedFileName}</span>
              <button
                onClick={clearAttachment}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
            className="hidden"
          />
        </label>
        <button
          onClick={sendMessage}
          disabled={(!newMessage.trim() && !attachment) || wsStatus !== 'CONNECTED'}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Image Modal Component
const ImageModal = ({ isOpen, imgSrc, closeModal }) => {
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <div className="relative max-w-full max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={imgSrc}
          alt="Enlarged view"
          className="max-w-full max-h-[85vh] object-contain mx-auto rounded shadow-lg"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
        <button
          className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-200"
          onClick={closeModal}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Create Community Modal Component
const CreateCommunityModal = ({ isOpen, onClose, newCommunity, setNewCommunity, handleCreateCommunity }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Community</h2>
        <form onSubmit={handleCreateCommunity}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={newCommunity.name}
              onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newCommunity.description}
              onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={newCommunity.category}
              onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
            <input
              type="file"
              onChange={(e) => setNewCommunity({ ...newCommunity, cover_image: e.target.files[0] })}
              accept=".jpg,.jpeg,.png"
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Chat Area Component
const ChatArea = ({ 
  selectedCommunityId, 
  community, 
  messages, 
  error, 
  wsStatus, 
  userMemberships, 
  user, 
  leaveCommunity, 
  newMessage, 
  setNewMessage, 
  attachment, 
  attachmentPreview, 
  selectedFileName, 
  clearAttachment, 
  handleFileChange, 
  sendMessage, 
  openImageModal,
  messagesEndRef 
}) => {
  if (!selectedCommunityId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a community to start chatting
      </div>
    );
  }

  return (
    <>
      <ChatHeader 
        community={community} 
        wsStatus={wsStatus} 
        selectedCommunityId={selectedCommunityId}
        userMemberships={userMemberships}
        leaveCommunity={leaveCommunity}
        user={user}
      />

      {/* Error Message */}
      {error && (
        <div className="text-center py-4 text-red-500">{error}</div>
      )}

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage 
              key={msg.id || `msg-${index}`} 
              message={msg} 
              openImageModal={openImageModal}
              isOwnMessage={msg.isOwnMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {(community?.is_member || user.user_type === 'admin') && (
        <ChatInput 
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          attachment={attachment}
          attachmentPreview={attachmentPreview}
          selectedFileName={selectedFileName}
          clearAttachment={clearAttachment}
          handleFileChange={handleFileChange}
          sendMessage={sendMessage}
          wsStatus={wsStatus}
        />
      )}
    </>
  );
};

// Main Component
const CommunityChatApp = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [exploreCommunities, setExploreCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [userMemberships, setUserMemberships] = useState({});
  const [imageModal, setImageModal] = useState({ isOpen: false, imgSrc: '' });
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: '',
    cover_image: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const navigate = useNavigate();
  const processedMessageIds = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isUserMessage = (message) => {
    const userIdStr = String(user.id);
    return (
      (message.sender_id && String(message.sender_id) === userIdStr) ||
      (message.sender && message.sender === user.username) ||
      (message.user && String(message.user) === userIdStr) ||
      (message.user_id && String(message.user_id) === userIdStr)
    );
  };

  const filterCommunities = (communitiesList) => {
    if (!searchQuery) return communitiesList;
    return communitiesList.filter(
      (community) =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const communitiesResponse = await axiosInstance.get('/community/communities/');
      const membershipsResponse = await axiosInstance.get('/community/members/');
      const membershipMap = {};
      membershipsResponse.forEach((membership) => {
        membershipMap[membership.community] = true;
      });
      setUserMemberships(membershipMap);
      setCommunities(communitiesResponse);
      const myComms = communitiesResponse.filter((c) => membershipMap[c.id] || user.user_type === 'admin');
      const exploreComms = communitiesResponse.filter((c) => !membershipMap[c.id] && user.user_type !== 'admin');
      setMyCommunities(myComms);
      setExploreCommunities(exploreComms);
    } catch (err) {
      setError(err.message || 'Failed to fetch communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchCommunities();

    const initializeWebSocket = async () => {
      try {
        await WebSocketService.connect();
        console.log('WebSocket initialized');
      } catch (err) {
        setError('Failed to connect to chat service');
        console.error('WebSocket connection error:', err);
      }
    };

    initializeWebSocket();

    const statusInterval = setInterval(() => {
      setWsStatus(WebSocketService.getStatus());
    }, 2000);

    WebSocketService.onMessage((data) => {
      console.log('Received WebSocket message:', data);
      if (data.error) {
        console.error('WebSocket error:', data.error);
        setError(data.error);
        return;
      }

      if (data.type === 'connection_established') {
        console.log('WebSocket connection established:', data.message);
        return;
      }

      if (String(data.community_id) === String(selectedCommunityId)) {
        setMessages((prev) => {
          const messageId = data.id;
          if (messageId && processedMessageIds.current.has(messageId)) {
            console.log('Duplicate message ignored:', data);
            return prev;
          }
          if (messageId) {
            processedMessageIds.current.add(messageId);
          }
          const formattedMessage = {
            id: data.id,
            content: data.content,
            attachment: data.attachment,
            sender: data.sender,
            sender_id: data.sender_id,
            timestamp: data.timestamp || data.created_at,
            isOwnMessage: isUserMessage(data),
          };
          console.log('Adding message to state:', formattedMessage);
          const filteredMessages = prev.filter(
            (msg) => !msg.isOptimistic || msg.content !== formattedMessage.content
          );
          return [...filteredMessages, formattedMessage].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
      }
    });

    return () => {
      clearInterval(statusInterval);
      WebSocketService.disconnect();
      processedMessageIds.current.clear();
    };
  }, [isAuthenticated, navigate, selectedCommunityId, user.id, user.username]);

  useEffect(() => {
    if (!selectedCommunityId) {
      setMessages([]);
      setCommunity(null);
      setError(null); // Clear error when no community is selected
      processedMessageIds.current.clear();
      return;
    }

    const fetchCommunityDetails = async () => {
      try {
        const response = await axiosInstance.get(`/community/communities/${selectedCommunityId}/`);
        setCommunity(response);
        return response;
      } catch (err) {
        console.error('Error fetching community details:', err);
        setError(err.message || 'Failed to fetch community details');
        return null;
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(`/community/messages/?community=${selectedCommunityId}`);
        processedMessageIds.current.clear();
        const processedMessages = (response || []).map((msg) => {
          if (msg.id) {
            processedMessageIds.current.add(msg.id);
          }
          return {
            ...msg,
            isOwnMessage: isUserMessage(msg),
          };
        });
        setMessages(processedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message || 'Failed to fetch messages');
      }
    };

    const initChat = async () => {
      if (!isAuthenticated) return;
      setError(null); // Clear error before loading new community
      const communityData = await fetchCommunityDetails();
      if (!communityData) return;
      if (communityData.is_member || user.user_type === 'admin') {
        await fetchMessages();
      } else {
        setError('You must join this community to view messages');
        setMessages([]);
      }
    };

    initChat();
  }, [selectedCommunityId, isAuthenticated, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newCommunity.name);
      formData.append('description', newCommunity.description);
      formData.append('category', newCommunity.category);
      if (newCommunity.cover_image) {
        formData.append('cover_image', newCommunity.cover_image);
      }
      const response = await axiosInstance.post('/community/communities/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchCommunities();
      setSelectedCommunityId(response.id);
      setIsCreateModalOpen(false);
      setNewCommunity({ name: '', description: '', category: '', cover_image: null });
      alert('Community created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create community');
    }
  };

  const joinCommunity = async (communityId) => {
    try {
      await axiosInstance.post(`/community/communities/${communityId}/join/`);
      setUserMemberships((prev) => ({ ...prev, [communityId]: true }));
      const communityToJoin = exploreCommunities.find((c) => c.id === communityId);
      setMyCommunities((prev) => [...prev, communityToJoin]);
      setExploreCommunities((prev) => prev.filter((c) => c.id !== communityId));
      alert('Successfully joined the community!');
      if (selectedCommunityId === communityId) {
        const response = await axiosInstance.get(`/community/communities/${communityId}/`);
        setCommunity(response);
        setError(null); // Clear error after joining
        const responseMessages = await axiosInstance.get(`/community/messages/?community=${communityId}`);
        const processedMessages = (responseMessages || []).map((msg) => ({
          ...msg,
          isOwnMessage: isUserMessage(msg),
        }));
        setMessages(processedMessages);
      }
    } catch (err) {
      alert(err.message || 'Failed to join community');
    }
  };

  const leaveCommunity = async (communityId) => {
    try {
      await axiosInstance.post(`/community/communities/${communityId}/leave/`);
      setUserMemberships((prev) => {
        const updated = { ...prev };
        delete updated[communityId];
        return updated;
      });
      const communityToLeave = myCommunities.find((c) => c.id === communityId);
      setExploreCommunities((prev) => [...prev, communityToLeave]);
      setMyCommunities((prev) => prev.filter((c) => c.id !== communityId));
      if (selectedCommunityId === communityId) {
        setSelectedCommunityId(null);
        setCommunity(null);
        setMessages([]);
        setError(null); // Clear error after leaving
      }
      alert('Successfully left the community.');
    } catch (err) {
      setError(err.message || 'Failed to leave community');
      alert(err.message || 'Failed to leave community');
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setAttachment(file);
      setSelectedFileName(file.name);
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
    setSelectedFileName('');
  };

  const openImageModal = (imgSrc) => {
    setImageModal({ isOpen: true, imgSrc });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imgSrc: '' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    try {
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        content: newMessage,
        sender: user.username,
        sender_id: user.id,
        timestamp: new Date().toISOString(),
        isOwnMessage: true,
        isOptimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMessage].sort(
        (a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)
      ));
      if (attachment) {
        const formData = new FormData();
        formData.append('community', selectedCommunityId);
        formData.append('content', newMessage);
        formData.append('attachment', attachment);
        const response = await axiosInstance.post('/community/messages/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.id) {
          processedMessageIds.current.add(response.id);
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...response, isOwnMessage: true } : msg
          )
        );
      } else {
        if (WebSocketService.getStatus() !== 'CONNECTED') {
          alert('Connection to chat server lost. Reconnecting...');
          await WebSocketService.connect();
          return;
        }
        WebSocketService.sendMessage({
          community_id: selectedCommunityId,
          message: newMessage,
        });
      }
      setNewMessage('');
      clearAttachment();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + (err.message || 'Unknown error'));
    }
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view communities.</div>;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error && !selectedCommunityId) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;

  return (
    <div className="flex min-h-[90vh] flex-col md:flex-row overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden bg-gray-100 border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Communities</h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-600 hover:text-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isSidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <CommunitySidebar
        isSidebarOpen={isSidebarOpen}
        myCommunities={myCommunities}
        exploreCommunities={exploreCommunities}
        selectedCommunityId={selectedCommunityId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        setSelectedCommunityId={setSelectedCommunityId}
        filterCommunities={filterCommunities}
        joinCommunity={joinCommunity}
        user={user}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-[90vh]">
        <ChatArea
          selectedCommunityId={selectedCommunityId}
          community={community}
          messages={messages}
          error={error}
          wsStatus={wsStatus}
          userMemberships={userMemberships}
          user={user}
          leaveCommunity={leaveCommunity}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          attachment={attachment}
          attachmentPreview={attachmentPreview}
          selectedFileName={selectedFileName}
          clearAttachment={clearAttachment}
          handleFileChange={handleFileChange}
          sendMessage={sendMessage}
          openImageModal={openImageModal}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        newCommunity={newCommunity}
        setNewCommunity={setNewCommunity}
        handleCreateCommunity={handleCreateCommunity}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        imgSrc={imageModal.imgSrc}
        closeModal={closeImageModal}
      />
    </div>
  );
};

export default CommunityChatApp;