import React from "react";
import ProfileHeader from "../../components/jobseeker/ProfileHeader";
import PersonalDetails from "../../components/jobseeker/PersonalDetails";
import { useSelector } from "react-redux";
import Experience from "../../components/jobseeker/Experience";
import Education from "../../components/jobseeker/Education";
import SavedJobs from "../../components/jobseeker/SavedJobs";

const ProfilePage = () => {
      const { loading,isAuthenticated } = useSelector((state) => state.auth);
      const experiences = [
        {
          jobTitle: "Frontend Developer",
          company: "InnovateX",
          startDate: "Mar 2023",
          endDate: "Present",
          location: "Remote",
          description: "Built dynamic dashboards using React and Tailwind CSS.",
        },
      ];
  const education=[
    {
      institution: "XYZ University",
      degree: "B.Tech",
      startYear: "2019",
      endYear: "2023",
      location: "Chennai",
      fieldOfStudy: "Computer Science",
    },
  ]
  const savedJobs = [
    {
      id: 1,
      title: "Frontend Developer",
      company: "TechNova Solutions",
      location: "Bangalore, India",
      type: "Full-time",
      savedDate: "2025-04-08",
    },
    {
      id: 2,
      title: "Backend Developer",
      company: "CodeCraft Inc.",
      location: "Chennai, India",
      type: "Part-time",
      savedDate: "2025-04-06",
    },
  ];
  const user = {
    firstName: "Vaishnav",
    lastName: "T",
    gender: "Male",
    currentSalary: "₹8,00,000",
    expectedSalary: "₹10,00,000",
    experience: "3 Years",
    description: "A passionate full-stack developer with experience in building responsive apps.",
    resumeLink: "https://example.com/resume.pdf",
    resumeName: "vaishnav_resume.pdf"
  };
  
  


          
  return (
    <div className="px-4 sm:px-8 md:px-16 py-8 max-w-screen-xl mx-auto space-y-10">
      <ProfileHeader
  name="Vaishnav"
  email="vaishanvt2@gmail.com"
  imageUrl="/assets/profile-pic.png"
  onEdit={() => console.log("Edit button clicked")}
/>

    <PersonalDetails user={user} />
    <Experience experiences={experiences}/>
    <Education education={education}/>
    <SavedJobs savedJobs={savedJobs}/>
    </div>
  );
};

export default ProfilePage;
