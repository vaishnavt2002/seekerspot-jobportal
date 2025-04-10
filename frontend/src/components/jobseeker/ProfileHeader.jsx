import React from "react";

const ProfileHeader = ({ name, email, imageUrl, onEdit }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white shadow rounded-lg">
      <img
        src={imageUrl || "https://via.placeholder.com/150"}
        alt="profile"
        className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
      />
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-semibold text-gray-800">{name || "User Name"}</h2>
        <p className="text-gray-500 text-sm">{email || "user@example.com"}</p>
      </div>
      <div className="mt-3 sm:mt-0 sm:ml-auto">
        <button
          onClick={onEdit}
          className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
