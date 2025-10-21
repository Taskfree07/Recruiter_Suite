import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ResumeDashboard from './pages/ResumeDashboard';
import CeipalSettings from './pages/CeipalSettings';
import CeipalJobs from './pages/CeipalJobs';
import CandidateDatabase from './pages/CandidateDatabase';
import OutlookJobs from './pages/OutlookJobs';
import JobPipeline from './pages/JobPipeline';

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ats-optimizer" element={<Dashboard />} />
            <Route path="/resume-dashboard" element={<ResumeDashboard />} />
            <Route path="/ceipal-settings" element={<CeipalSettings />} />
            <Route path="/ceipal-jobs" element={<CeipalJobs />} />
            <Route path="/candidate-database" element={<CandidateDatabase />} />
            <Route path="/outlook-jobs" element={<OutlookJobs />} />
            <Route path="/job-pipeline" element={<JobPipeline />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;