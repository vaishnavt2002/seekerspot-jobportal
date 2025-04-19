import LandingPage from '../pages/LandingPage';
import JobSeekerLayout from '../layouts/JobSeekerLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRouteWithRedirect from '../components/PublicRouteWithRedirect';
import ProfilePage from '../pages/jobseeker/ProfilePage';
import FindJobsPage from '../pages/jobprovider/FindJobsPage';
import JobPostingPage from '../pages/jobseeker/JobPostingPage';

const JobSeekerRoutes = [
  {
    path: '/',
    element: <JobSeekerLayout />,
    children: [
      {
        index: true,
        element: (
          <PublicRouteWithRedirect>
            <LandingPage />
          </PublicRouteWithRedirect>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute role="job_seeker">
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'find-jobs',
        element: (
          <ProtectedRoute role="job_seeker">
            <FindJobsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'job/:jobId',
        element: (
          <ProtectedRoute role="job_seeker">
            <JobPostingPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default JobSeekerRoutes;