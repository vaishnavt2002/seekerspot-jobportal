import { Navigate } from 'react-router-dom';
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

  useEffect(() => {
    // Prevent multiple auth check attempts in development mode with React StrictMode
    if (authCheckAttempted.current) return;
    
    const verifyAuth = async () => {
      // If already authenticated, we're good
      if (isAuthenticated) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // Try to get the profile directly first
        await getProfile();
        console.log("Successfully retrieved profile on protected route");
      } catch (err) {
        console.log("Failed to get profile on protected route:", err);
        
        // Only try refresh if server is responding but returned 401
        if (err.status === 401) {
          try {
            console.log("Attempting token refresh from protected route");
            await dispatch(refreshTokenThunk()).unwrap();
            // Token refresh successful, user state will be updated by App.js
          } catch (refreshErr) {
            console.error("Auth refresh failed on protected route:", refreshErr);
            // Auth failed completely, will redirect to login
          }
        }
      } finally {
        authCheckAttempted.current = true;
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [dispatch, isAuthenticated]);

  // Show loading while checking authentication or while global auth loading is true
  if (loading || isCheckingAuth) {
    return <Loading />;
  }

  // Only redirect after we've finished checking authentication
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Only check role after we know we're authenticated
  if (role && user?.user_type !== role) {
    console.log(`User type (${user?.user_type}) doesn't match required role (${role}), redirecting to home`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;