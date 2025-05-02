import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import MeetingRoom from '../components/MeetingRoom';

// Shared routes that can be accessed by multiple user types
const SharedRoutes = [
  // Meeting route that's accessible to both job providers and job seekers
  {
    path: '/meet/:meetingId',
    element: (
      <ProtectedRoute>
        <MeetingRoom />
      </ProtectedRoute>
    ),
  },
  // Fallback route for any unmatched paths
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default SharedRoutes;