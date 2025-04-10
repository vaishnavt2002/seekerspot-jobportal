import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const JobSeekerLayout = () => (
  <div className="job-seeker-layout">
    <Navbar />
    <main className="container mx-auto p-4">
      <Outlet />
    </main>
  </div>
);

export default JobSeekerLayout;