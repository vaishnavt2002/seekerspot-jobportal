import SignupPage from '../pages/auth/SignupPage';
import LoginPage from '../pages/auth/LoginPage';
import AuthLayout from '../layouts/AuthLayout';
import ResetPassword from '../components/auth/ResetPassword';

const AuthRoutes = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'signup', element: <SignupPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
];

export default AuthRoutes;