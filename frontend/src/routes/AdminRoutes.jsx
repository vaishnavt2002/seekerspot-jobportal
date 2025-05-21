import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagement from '../components/admin/UserManagement';
import JobProviderManagement from '../components/admin/JobProviderManagement';
import VerificationManagement from '../components/admin/VerificatonManagement';
import ReportDashboard from '../components/admin/ReportDashboard';

const AdminRoutes = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute role="admin">
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'companies',
        element: (
          <ProtectedRoute role="admin">
            <JobProviderManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'verify-companies',
        element: (
          <ProtectedRoute role="admin">
            <VerificationManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute role="admin">
            <ReportDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default AdminRoutes;