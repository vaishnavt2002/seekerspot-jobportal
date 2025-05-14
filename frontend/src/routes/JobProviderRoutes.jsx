import JobProviderLayout from '../layouts/JobProviderLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import JobProviderDashboard from '../pages/jobprovider/Dashboard';
import ProfilePage from '../pages/jobprovider/ProfilePage';
import JobPostsPage from '../pages/jobprovider/JobPostsPage';
import ApplicantsPage from '../pages/jobprovider/ApplicantsPage';
import ShorlistedPage from '../pages/jobseeker/ShorlistedPage';
import MeetingRoom from '../components/MeetingRoom';
import CommunityChatApp from '../pages/jobseeker/CommunityChatApp';
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
      {
        path: 'applicants',
        element: (
          <ProtectedRoute role="job_provider">
            <ApplicantsPage/>
          </ProtectedRoute>
        ),
      },
      {
        path: 'shortlisted',
        element: (
          <ProtectedRoute role="job_provider">
            <ShorlistedPage/>
          </ProtectedRoute>
        ),
      },
      {
        path: 'community',
        element: (
          <ProtectedRoute role="job_provider">
            <CommunityChatApp/>
          </ProtectedRoute>
        ),
      },
      
    ],
    
  },
  {
    path: '/jobprovider/meet/:meetingId', 
    element: (
      <ProtectedRoute role="job_provider">
        <MeetingRoom />
      </ProtectedRoute>
    ),
  },
];

export default JobProviderRoutes;