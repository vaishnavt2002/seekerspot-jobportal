import SignupPage from '../pages/auth/SignupPage';
import LoginPage from '../pages/auth/LoginPage';
import AuthLayout from '../layouts/AuthLayout';
import ResetPassword from '../components/auth/ResetPassword';
import PublicRoute from '../components/PublicRoute';

const AuthRoutes = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'signup', element: <PublicRoute><SignupPage /></PublicRoute> },
      { path: 'login', element: <PublicRoute><LoginPage /></PublicRoute> },
      { path: 'reset-password', element: <PublicRoute><ResetPassword /></PublicRoute> },
    ],
  },
];

export default AuthRoutes;