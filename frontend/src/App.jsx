import { useState } from 'react'

import './App.css'
import SignupPage from './pages/auth/SignupPage'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/LandingPage';

function App() {

  return (
    <Router>
            <div className="App">
                <Routes>
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<LandingPage/>} /> 
                </Routes>
            </div>
        </Router>
  )
}

export default App
