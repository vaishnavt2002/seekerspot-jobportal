import SignupPage from '../pages/auth/SignupPage';
import LoginPage from '../pages/auth/LoginPage';
import AuthLayout from '../layouts/AuthLayout';

const AuthRoutes = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'signup', element: <SignupPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
];

export default AuthRoutes;