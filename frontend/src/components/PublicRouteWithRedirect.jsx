import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './Loading';

const PublicRouteWithRedirect = ({ children }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Loading />;
  }
  if (isAuthenticated && user?.user_type === 'admin') {
    console.log("Job provider accessing public route, redirecting to dashboard");
    return <Navigate to="/admin/dashboard" replace />;
  }
  console.log('user is:..................',user)
  if (isAuthenticated && user?.user_type === 'job_provider') {
    console.log("Job provider accessing public route, redirecting to dashboard");
    return <Navigate to="/jobprovider/dashboard" replace />;
  }
  

  return children;
};

export default PublicRouteWithRedirect;