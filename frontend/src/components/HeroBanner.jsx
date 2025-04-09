import { Briefcase, Building2, Users, FilePlus } from 'lucide-react';
import womanImg from '../assets/women.jpg';
export default function HeroBanner() {
  return (
    <section className="px-50 bg-white">
      <div className="mx-auto flex items-center justify-between">
        
        
        <div className='w-[60%]'> 
          <h1 className="text-7xl font-bold text-gray-900 leading-tight">
            Discover more <br /> than <br /><span className="text-blue-600 relative inline-block">
              5000+ Jobs
            </span>
          </h1>

          <div className="mt-8 bg-white border border-gray-300 rounded-lg shadow-sm p-4 flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
            <input type="text" placeholder="Job title, Keyword..." className="flex-1 border border-gray-200 rounded-md px-4 py-2 text-sm outline-none" />
            <input type="text" placeholder="Your Location" className="flex-1 border border-gray-200 rounded-md px-4 py-2 text-sm outline-none" />
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-md">
              Find Job
            </button>
          </div>

        </div>

        <div className="hidden lg:block">
          <img src={womanImg} alt="Job Search"  className="w-full max-w-md mx-auto" />
        </div>
      </div>

          {/* Statistics */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center text-sm text-gray-700">
            <div className='flex items-center justify-center'>
              <Briefcase className=" mr-6 h-10 w-10 mb-2 text-blue-600" />
              <div>
                <div className="font-bold text-lg">1,75,324</div>
                <div>Live Job</div>
              </div>
            </div>
            <div className='flex items-center justify-center'>
              <Building2 className="mr-6 h-10 w-10 mb-2 text-blue-600" />
              <div>
                <div className="font-bold text-lg">97,354</div>
                <div>Companies</div>
                </div>
            </div>
            <div className='flex items-center justify-center'>
              <Users className="mr-6 h-10 w-10 mb-2 text-blue-600" />
              <div>
                <div className="font-bold text-lg">38,47,154</div>
                <div>Candidates</div>
              </div>
            </div>
            <div  className='flex items-center justify-center'>
              <FilePlus className="mr-6 h-10 w-10 mb-2 text-blue-600" />
              <div>
                <div className="font-bold text-lg">7,532</div>
                <div>New Jobs</div>
                </div>
            </div>
          </div>
    </section>
  );
}