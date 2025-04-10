import React, { useState } from "react";
import { FaCog, FaBars } from "react-icons/fa";
import SeekerSpot from "../SeekerSpot";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const [isOpen, setIsOpen] = useState(false); 

  const menuItems = [
    "Dashboard",
    "Job Posts",
    "Applicants",
    "Shortlisted Applicants",
    "Interviews",
  ];

  return (
    <>
      <div className="md:hidden flex justify-between items-center bg-white p-4 shadow-md">
        <SeekerSpot />
        <button
          className="text-gray-600 text-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaBars />
        </button>
      </div>

      <div
        className={`bg-white shadow-lg p-6 h-screen w-64 flex-col justify-between fixed z-50 top-0 left-0 transform transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative md:flex`}
      >
        <div>
          <div className="hidden md:flex items-center my-10">
            <SeekerSpot className="h-8 w-auto" />
          </div>

          <ul className="space-y-4 mt-4">
            {menuItems.map((item) => (
              <li
                key={item}
                onClick={() => {
                  setActive(item);
                  setIsOpen(false); 
                }}
                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium ${
                  active === item
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                {item}
              </li>
            ))}
            <li
                key='logout'
                onClick={() => {
                  setActive(item);
                  setIsOpen(false); 
                }}
                className={'cursor-pointer px-4 py-2 rounded-lg text-sm font-medium '}
              >
                Logout
              </li>
          </ul>
        </div>

        <div
          onClick={() => {
            setActive("Company Profile");
            setIsOpen(false); // close on mobile
          }}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-6 ${
            active === "Company Profile"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:bg-blue-100"
          }`}
        >
          <FaCog />
          Company Profile
        </div>
      </div>

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
