
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './Loading';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Loading/> 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.user_type !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;