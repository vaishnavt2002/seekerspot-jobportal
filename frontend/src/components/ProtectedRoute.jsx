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

  useEffect(() => {    if (authCheckAttempted.current) return;
    
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
  }, [dispatch, isAuthenticated]);

  if (loading || isCheckingAuth) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (role && user?.user_type !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;