import LandingPage from '../pages/LandingPage';
import JobSeekerLayout from '../layouts/JobSeekerLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRouteWithRedirect from '../components/PublicRouteWithRedirect';
import ProfilePage from '../pages/jobseeker/ProfilePage';
import FindJobsPage from '../pages/jobprovider/FindJobsPage';
import JobPostingPage from '../pages/jobseeker/JobPostingPage';
import CommunityList from '../pages/jobseeker/CommunityList';
import CommunityChat from '../pages/jobseeker/CommunityChat';

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
      {
        path: 'communities',
        element: (
          <ProtectedRoute role='job_seeker'>
            <CommunityList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'community/:communityId/chat',
        element: (
          <ProtectedRoute role='job_seeker'>
            <CommunityChat />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default JobSeekerRoutes;