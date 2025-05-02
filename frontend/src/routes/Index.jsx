import AuthRoutes from './AuthRoutes';
import JobSeekerRoutes from './JobSeekerRoutes';
import JobProviderRoutes from './JobProviderRoutes';
import SharedRoutes from './SharedRoutes';

const routes = [
  ...AuthRoutes,
  ...JobSeekerRoutes,
  ...JobProviderRoutes,
  ...SharedRoutes,
  { path: '*', element: <div>404 - Page Not Found</div> },
];

export default routes;