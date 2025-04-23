import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Navbar from '../components/Navbar'
import HeroBanner from '../components/HeroBanner'
import PopularJobs from '../components/PopularJobs'
import FeaturedJobs from '../components/FeaturedJobs'
import { getHomeStats, getPopularJobs, getFeaturedJobs } from '../api/homeApi'

const LandingPage = () => {
  const [stats, setStats] = useState({
    live_jobs: 0,
    companies: 0,
    candidates: 0,
    new_jobs: 0
  })
  const [popularJobs, setPopularJobs] = useState([])
  const [featuredJobs, setFeaturedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Get authentication status from Redux store
  const { isAuthenticated } = useSelector((state) => state.auth)
  
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true)
        
        // Fetch statistics
        const statsResponse = await getHomeStats()
        setStats(statsResponse)
        
        // Fetch popular jobs
        const popularJobsResponse = await getPopularJobs()
        setPopularJobs(popularJobsResponse)
        
        // Fetch featured jobs if authenticated
        if (isAuthenticated) {
          const featuredJobsResponse = await getFeaturedJobs()
          setFeaturedJobs(featuredJobsResponse)
        }
      } catch (error) {
        console.error('Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHomeData()
  }, [isAuthenticated])
  
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner stats={stats} />
      <PopularJobs jobs={popularJobs} loading={loading} />
      {isAuthenticated && <FeaturedJobs jobs={featuredJobs} loading={loading} />}
    </div>
  )
}

export default LandingPage