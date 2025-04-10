import LandingPage from '../pages/LandingPage';
import JobSeekerLayout from '../layouts/JobSeekerLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import ProfilePage from '../pages/jobseeker/ProfilePage';

const JobSeekerRoutes = [
  {
    path: '/',
    element: <JobSeekerLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute role="job_seeker">
            <ProfilePage/>
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default JobSeekerRoutes;