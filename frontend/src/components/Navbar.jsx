import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import seekerSpotLogo from '../assets/SeekerSpot.svg';
import SeekersSpotLogo from './SeekerSpot';
import userIcon from '../assets/user_3917688.png';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../api/authApi";
import {logoutAction} from '../store/slices/authSlice';
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutAction());
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setIsOpen(false);
  };


  return (
    <nav className="bg-white shadow-sm px-20 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <SeekersSpotLogo className="h-8 w-auto" />
      </div>

      <div className="hidden md:flex gap-6 items-center text-sm text-gray-700">
        <Link to="/find-jobs" className="hover:text-blue-600">Find Jobs</Link>
        <Link to="/my-jobs" className="hover:text-blue-600">My Jobs</Link>
        <Link to="/community" className="hover:text-blue-600">Community</Link>
        {isAuthenticated ?<div className="hover:text-blue-600" onClick={handleLogout}>Logout</div>:<><Link to="/login" className="hover:text-blue-600">Login</Link><Link to="/signup" className="hover:text-blue-600">Sign Up</Link></>}
        
        {isAuthenticated&&<div className=""><img src={userIcon} alt="User Icon" className="w-6 h-6" /></div>}
        </div>

      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-t border-gray-200 shadow-md md:hidden z-50">
          <div className="flex flex-col px-4 py-3 space-y-3 text-sm text-gray-700">
            <Link to="/find-jobs" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>Find Jobs</Link>
            <Link to="/my-jobs" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>My Jobs</Link>
            <Link to="/community" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>Community</Link>
            {isAuthenticated ?<div className="hover:text-blue-600" onClick={handleLogout}>Logout</div>:<><Link to="/login" className="hover:text-blue-600">Login</Link><Link to="/signup" className="hover:text-blue-600">Sign Up</Link></>}
        
        {isAuthenticated&&<div className=""><img src={userIcon} alt="User Icon" className="w-6 h-6" /></div>}
          </div>
        </div>
      )}
    </nav>
  );
}
