import JobProviderLayout from '../layouts/JobProviderLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import JobProviderDashboard from '../pages/jobprovider/Dashboard';
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
    ],
  },
];

export default JobProviderRoutes;