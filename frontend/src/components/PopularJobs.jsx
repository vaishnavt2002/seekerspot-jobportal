import React from 'react';
import { MapPin, Clock, BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PopularJobs({ jobs, loading }) {
  const baseURL=import.meta.env.VITE_BASE_URL
  if (loading) {
    return (
      <p>loading....</p>
    )
  }

  return (
    <section className="px-6 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold">Popular Jobs</h2>
          <Link to="/find-jobs" className="text-blue-600 hover:text-blue-800 font-medium">
            View All Jobs
          </Link>
        </div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} to={`/job/${job.id}`}>
              <div className="bg-white shadow-sm rounded-lg p-6 transition hover:shadow-md cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  {job.company_logo ? (
                    <img 
                      src={job.company_logo} 
                      alt={job.company} 
                      className="h-10 w-10 object-contain rounded-md"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center">
                      <BriefcaseBusiness size={20} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  <span>{job.location}</span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                    {job.type.replace('_', ' ').toLowerCase()}
                  </span>
                  <span className="text-sm text-gray-700">{job.salary}</span>
                </div>
                
                <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{job.posted}</span>
                  </div>
                  <span>{job.application_count} applicants</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}