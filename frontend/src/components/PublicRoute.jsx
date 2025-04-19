import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../components/Loading';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    console.log("Authenticated user attempting to access public route, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;