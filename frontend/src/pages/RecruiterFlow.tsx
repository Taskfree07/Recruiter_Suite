import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RecruiterFlow: React.FC = () => {
  const navigate = useNavigate();

  const upcomingFeatures = [
    {
      icon: UserGroupIcon,
      title: 'Candidate Pipeline',
      description: 'Visual kanban board to track candidates through your hiring stages',
      status: 'In Development'
    },
    {
      icon: CalendarIcon,
      title: 'Interview Scheduling',
      description: 'Automated interview scheduling with calendar integration',
      status: 'Planned'
    },
    {
      icon: DocumentCheckIcon,
      title: 'Application Tracking',
      description: 'Comprehensive application management system',
      status: 'Planned'
    },
    {
      icon: ChartBarIcon,
      title: 'Hiring Analytics',
      description: 'Real-time insights into your recruitment metrics',
      status: 'Planned'
    },
    {
      icon: ClockIcon,
      title: 'Time-to-Hire Tracking',
      description: 'Monitor and optimize your hiring timeline',
      status: 'Planned'
    },
    {
      icon: CheckCircleIcon,
      title: 'Offer Management',
      description: 'Streamline offer creation and approval process',
      status: 'Planned'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-2 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Recruiter Flow
                  </h1>
                  <p className="text-sm text-gray-600">
                    Complete Recruitment Management System
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
              Coming Soon
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-6">
            <UserGroupIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Complete Hiring Solution
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We're building a comprehensive recruitment management system to streamline your entire hiring process from application to offer.
          </p>
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full text-sm font-medium">
            <ClockIcon className="h-5 w-5" />
            <span>Expected Launch: Q2 2025</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Upcoming Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {feature.description}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        feature.status === 'In Development'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Want Early Access?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Be the first to know when Recruiter Flow launches. Get exclusive early access and special features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/ats-optimizer')}
              className="px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Try ATS Optimizer Now
            </button>
            <button className="px-8 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors">
              Notify Me on Launch
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h4 className="text-xl font-bold text-gray-900 mb-4">
            In the Meantime...
          </h4>
          <p className="text-gray-600 mb-4">
            While we're building Recruiter Flow, you can use our <strong>ATS Resume Optimizer</strong> to:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Analyze and score candidate resumes against job descriptions</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Compare multiple candidates and identify top talent</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Get AI-powered insights on skill matches and improvements</span>
            </li>
          </ul>
          <button
            onClick={() => navigate('/ats-optimizer')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Go to ATS Optimizer →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Recruiter Flow - Coming Soon
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RecruiterFlow;
