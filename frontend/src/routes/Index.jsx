import AuthRoutes from './AuthRoutes';
import JobSeekerRoutes from './JobSeekerRoutes';
import JobProviderRoutes from './JobProviderRoutes';

const routes = [
  ...AuthRoutes,
  ...JobSeekerRoutes,
  ...JobProviderRoutes,
  { path: '*', element: <div>404 - Page Not Found</div> },
];

export default routes;