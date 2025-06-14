import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './Loading';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Check if this is a meeting route
  const isMeetingRoute = location.pathname.includes('/meet/');

  // Show loading until auth check is complete
  if (loading || !authChecked) {
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