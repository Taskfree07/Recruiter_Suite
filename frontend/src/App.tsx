import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import RecruiterFlow from './pages/RecruiterFlow';

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ats-optimizer" element={<Dashboard />} />
            <Route path="/recruiter-flow" element={<RecruiterFlow />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;