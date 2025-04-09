import React from 'react'
import Navbar from '../components/Navbar'
import HeroBanner from '../components/HeroBanner'
import PopularJobs from '../components/PopularJobs'

const LandingPage = () => {
  return (
    <div>
      <Navbar/>
      <HeroBanner/>
      <PopularJobs/>
    </div>
  )
}

export default LandingPage
