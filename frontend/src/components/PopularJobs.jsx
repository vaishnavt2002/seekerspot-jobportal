import React from 'react';

const jobs = [
    {
      id: 1,
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      title: 'UI/UX Designer',
      company: 'Google inc',
      location: 'Mumbai, India',
      type: 'Full-Time',
      salary: 'Rs 2,00,000 - Rs 3,00,000',
      posted: '25 minutes ago',
    },
    {
      id: 2,
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Infosys_logo.svg',
      title: 'Web Developer Trainee',
      company: 'Infosys',
      location: 'Mumbai, India',
      type: 'Full-Time',
      salary: 'Rs 20,000 - Rs 25,000',
      posted: '1 week ago',
    },
    {
      id: 3,
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Wipro_Primary_Logo_Color_RGB.svg',
      title: 'Project Manager',
      company: 'Wipro',
      location: 'Bangalore, India',
      type: 'Full-Time',
      salary: 'Rs 70,000 - Rs 1,00,000',
      posted: '1 day ago',
    },
    {
      id: 4,
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      title: 'UI/UX Designer',
      company: 'Google inc',
      location: 'Mumbai, India',
      type: 'Full-Time',
      salary: 'Rs 2,00,000 - Rs 3,00,000',
      posted: '25 minutes ago',
    },
    {
      id: 5,
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Infosys_logo.svg',
      title: 'Web Developer Trainee',
      company: 'Infosys',
      location: 'Mumbai, India',
      type: 'Full-Time',
      salary: 'Rs 20,000 - Rs 25,000',
      posted: '1 week ago',
    },
    {
      id: 6,
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Wipro_Primary_Logo_Color_RGB.svg',
      title: 'Project Manager',
      company: 'Wipro',
      location: 'Bangalore, India',
      type: 'Full-Time',
      salary: 'Rs 70,000 - Rs 1,00,000',
      posted: '1 day ago',
    },
  ];
  

export default function PopularJobs() {
  return (
    <section className="px-6 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8">Popular Jobs</h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white shadow-sm rounded-lg p-6 transition hover:shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <img src={job.companyLogo} alt={job.company} className="h-10 w-10 object-contain" />
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">
                    {job.company} &bull; {job.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  {job.type}
                </span>
                <span className="text-sm text-gray-700">{job.salary}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{job.posted}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
