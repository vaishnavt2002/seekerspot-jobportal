import { Outlet } from 'react-router-dom';
import Sidebar from '../components/jobprovider/Sidebar'; // Adjust the path as necessary

const JobProviderLayout = () => (
  <div className="job-provider-layout flex">
    <Sidebar />
    <main className="flex-1 p-4">
      <Outlet />
    </main>
  </div>
);

export default JobProviderLayout;