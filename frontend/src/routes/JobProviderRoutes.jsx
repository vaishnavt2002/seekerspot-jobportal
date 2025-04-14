import JobProviderLayout from '../layouts/JobProviderLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import JobProviderDashboard from '../pages/jobprovider/Dashboard';
import ProfilePage from '../pages/jobprovider/ProfilePage';
import JobPostsPage from '../pages/jobprovider/JobPostsPage';
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
      {
        path: 'job-posts',
        element: (
          <ProtectedRoute role="job_provider">
            <JobPostsPage/>
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default JobProviderRoutes;