import LandingPage from '../pages/LandingPage';
import JobSeekerLayout from '../layouts/JobSeekerLayout';
import ProtectedRoute from '../components/ProtectedRoute';

const JobSeekerRoutes = [
  {
    path: '/',
    element: <JobSeekerLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute role="job_seeker">
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default JobSeekerRoutes;