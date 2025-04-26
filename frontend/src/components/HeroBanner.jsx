import React from 'react';
import { Briefcase, Building2, Users, FilePlus } from 'lucide-react';
import womanImg from '../assets/women.jpg';

export default function HeroBanner({ stats }) {
  
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <section className="px-6 py-12 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 mb-8 md:mb-0"> 
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Discover more <br /> than <br />
            <span className="text-blue-600 relative inline-block">
              10000+ Jobs
            </span>
          </h1>
          <p className="mt-4 text-gray-600 text-lg">
            Find your dream job with our comprehensive job search platform.
          </p>
        </div>

        <div className="hidden md:block w-full md:w-1/2">
          <img 
            src={womanImg} 
            alt="Job Search" 
            className="w-full max-w-md mx-auto rounded-lg shadow-lg" 
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center bg-white p-4 rounded-lg shadow-sm">
          <Briefcase className="mr-4 h-10 w-10 text-blue-600" />
          <div>
            <div className="font-bold text-xl">{formatNumber(stats.live_jobs)}</div>
            <div className="text-gray-600">Live Jobs</div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-white p-4 rounded-lg shadow-sm">
          <Building2 className="mr-4 h-10 w-10 text-blue-600" />
          <div>
            <div className="font-bold text-xl">{formatNumber(stats.companies)}</div>
            <div className="text-gray-600">Companies</div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-white p-4 rounded-lg shadow-sm">
          <Users className="mr-4 h-10 w-10 text-blue-600" />
          <div>
            <div className="font-bold text-xl">{formatNumber(stats.candidates)}</div>
            <div className="text-gray-600">Candidates</div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-white p-4 rounded-lg shadow-sm">
          <FilePlus className="mr-4 h-10 w-10 text-blue-600" />
          <div>
            <div className="font-bold text-xl">{formatNumber(stats.new_jobs)}</div>
            <div className="text-gray-600">New Jobs</div>
          </div>
        </div>
      </div>
    </section>
  );
}