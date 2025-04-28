// src/pages/community/CommunityList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useSelector } from 'react-redux';

const CommunityList = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userMemberships, setUserMemberships] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch communities
        const communitiesData = await axiosInstance.get('/community/communities/');
        setCommunities(communitiesData);
        
        // Fetch user's memberships
        const memberships = await axiosInstance.get('/community/members/');
        
        // Create a lookup object for easier checking
        const membershipMap = {};
        memberships.forEach(membership => {
          membershipMap[membership.community] = true;
        });
        
        setUserMemberships(membershipMap);
      } catch (err) {
        setError(err.message || 'Failed to fetch communities');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, navigate]);

  const joinCommunity = async (communityId) => {
    try {
      await axiosInstance.post(`/community/communities/${communityId}/join/`);
      
      // Update local state
      setUserMemberships(prev => ({...prev, [communityId]: true}));
      
      // Show success message
      alert('Successfully joined the community!');
    } catch (err) {
      alert(err.message || 'Failed to join community');
    }
  };

  const leaveCommunity = async (communityId) => {
    try {
      await axiosInstance.post(`/community/communities/${communityId}/leave/`);
      
      // Update local state
      setUserMemberships(prev => {
        const updated = {...prev};
        delete updated[communityId];
        return updated;
      });
      
      // Show success message
      alert('Successfully left the community.');
    } catch (err) {
      alert(err.message || 'Failed to leave community');
    }
  };

  if (!isAuthenticated) {
    return <div className="text-center py-10">Please log in to view communities.</div>;
  }

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Communities</h2>
      
      {communities.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No communities found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => (
            <div
              key={community.id}
              className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={community.cover_image || '/placeholder-community.jpg'}
                alt={community.name}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-community.jpg';
                }}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">
                  <Link
                    to={`/community/${community.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {community.name}
                  </Link>
                </h3>
                <p className="text-gray-600 mt-1">{community.description || 'No description'}</p>
                <p className="text-sm text-gray-500 mt-2">Category: {community.category || 'General'}</p>
                
                {user.user_type === 'admin' ? (
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Admin access</span>
                    <Link
                      to={`/community/${community.id}/chat`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      View Chat
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-between items-center">
                    {userMemberships[community.id] ? (
                      <>
                        <button
                          onClick={() => leaveCommunity(community.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          Leave
                        </button>
                        <Link
                          to={`/community/${community.id}/chat`}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Chat
                        </Link>
                      </>
                    ) : (
                      <button
                        onClick={() => joinCommunity(community.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
                      >
                        Join
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityList;