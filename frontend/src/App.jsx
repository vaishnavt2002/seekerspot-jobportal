import { useState } from 'react'

import './App.css'
import SignupPage from './pages/SignupPage'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

function App() {

  return (
    <Router>
            <div className="App">
                <Routes>
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<SignupPage />} /> {/* Default route */}
                </Routes>
            </div>
        </Router>
  )
}

export default App
