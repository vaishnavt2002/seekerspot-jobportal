import JobProviderLayout from '../layouts/JobProviderLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import JobProviderDashboard from '../pages/jobprovider/Dashboard';
import ProfilePage from '../pages/jobprovider/ProfilePage';
const JobProviderRoutes = [
  {
    path: '/jobprovider',
    element: <JobProviderLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute role="job_provider">
            <JobProviderDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute role="job_provider">
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default JobProviderRoutes;