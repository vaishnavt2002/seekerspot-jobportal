import React, { useState } from "react";
import { FaCog, FaBars } from "react-icons/fa";
import SeekerSpot from "../SeekerSpot";
import { useDispatch } from "react-redux";
import { useNavigate, NavLink } from "react-router-dom";
import { logout } from "../../api/authApi";
import { logoutAction } from "../../store/slices/authSlice";
import { useNotifications } from "../../context/NotificationContext";
import CountBadge from "./CountBadge";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const menuItems = [
    { name: "Dashboard", path: "/jobprovider/dashboard" },
    { name: "Job Posts", path: "/jobprovider/job-posts" },
    { name: "Applicants", path: "/jobprovider/applicants" },
    { name: "Shortlisted Applicants", path: "/jobprovider/shortlisted" },
    { name: "Community", path: "/jobprovider/community" },
    { name: "Notifications", path: "/jobprovider/notifications", hasBadge: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutAction());
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setIsOpen(false);
  };

  // Badge component inline to use context
  const NotificationBadge = () => {
    if (unreadCount <= 0) return null;
    
    return (
      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 inline-flex items-center justify-center">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex justify-between items-center bg-white p-4 shadow-md">
        <button
          className="text-gray-600 text-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaBars />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg p-6 h-screen w-64 flex-col justify-between z-50 top-0 left-0 transform transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:fixed md:flex`}
      >
        <div>
          <div className="hidden md:flex items-center my-10">
            <SeekerSpot className="h-8 w-auto" />
          </div>

          <ul className="space-y-4 mt-4">
            {menuItems.map(({ name, path, hasBadge }) => (
              <li key={name} onClick={() => setIsOpen(false)}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 hover:bg-blue-100"
                    }`
                  }
                >
                  <span>{name}</span>
                  {hasBadge && <CountBadge />}
                </NavLink>
              </li>
            ))}

            {/* Logout */}
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-100"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>

        {/* Company Profile */}
        <NavLink
          to="/jobprovider/profile"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-6 ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-blue-100"
            }`
          }
        >
          <FaCog />
          Company Profile
        </NavLink>
      </div>

      {/* Placeholder for sidebar space on medium and larger screens */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;