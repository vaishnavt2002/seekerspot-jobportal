import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import Loading from './Loading';
import { refreshTokenThunk } from '../store/slices/authSlice';
import { getProfile } from '../api/authApi';

const ProtectedRoute = ({ children, role }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const authCheckAttempted = useRef(false);
  const location = useLocation();
  
  // Check if this is a meeting route
  const isMeetingRoute = location.pathname.includes('/meet/');

  useEffect(() => {
    if (authCheckAttempted.current) return;
    
    const verifyAuth = async () => {
      if (isAuthenticated) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        await getProfile();
      } catch (err) {
        if (err.status === 401) {
          try {
            console.log("Attempting token refresh from protected route");
            await dispatch(refreshTokenThunk()).unwrap();
          } catch (refreshErr) {
            console.error("Auth refresh failed on protected route:", refreshErr);
          }
        }
      } finally {
        authCheckAttempted.current = true;
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [dispatch, isAuthenticated, user]);

  if (loading || isCheckingAuth) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check if role-based access is required
  if (role) {
    // For meeting routes, allow both job_provider and job_seeker access
    if (isMeetingRoute && (user?.user_type === 'job_provider' || user?.user_type === 'job_seeker')) {
      return children;
    }
    
    // For non-meeting routes, enforce the specific role requirement
    if (user?.user_type !== role) {
      // Redirect to appropriate dashboard based on user type
      if (user?.user_type === 'job_provider') {
        return <Navigate to="/jobprovider/dashboard" replace />;
      }
      if (user?.user_type === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;