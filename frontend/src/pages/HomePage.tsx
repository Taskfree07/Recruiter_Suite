import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentMagnifyingGlassIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Salary Predictor',
      description: 'Get accurate salary ranges from Indeed, Glassdoor, ZipRecruiter, and more. AI-powered predictions with cost-of-living adjustments.',
      icon: CurrencyDollarIcon,
      path: '/salary-predictor',
      color: 'from-green-500 to-teal-600',
      highlights: [
        'Multi-Source Data',
        'Real-Time Scraping',
        'COL Adjustments',
        'Percentile Analysis'
      ],
      badge: 'New'
    },
    {
      title: 'ATS Resume Optimizer',
      description: 'Upload job descriptions and analyze candidate resumes with AI-powered scoring. Get detailed insights on skill matches, experience, and keyword optimization.',
      icon: DocumentMagnifyingGlassIcon,
      path: '/ats-optimizer',
      color: 'from-indigo-500 to-purple-600',
      highlights: [
        'Smart Resume Scoring',
        'Skill Matching Analysis',
        'Keyword Optimization',
        'Candidate Comparison'
      ]
    },
    {
      title: 'Resume Dashboard',
      description: 'Automatically organize resumes from Ceipal and uploads by skills. Smart categorization for Java, Python, React, and 100+ technologies.',
      icon: UserGroupIcon,
      path: '/resume-dashboard',
      color: 'from-green-500 to-teal-600',
      highlights: [
        'Auto Skill Detection',
        'Ceipal Integration',
        'Smart Categorization',
        'Candidate Scoring'
      ]
    },
    {
      title: 'Job Pipeline',
      description: 'Unified job management from VMS, iLabor360, Ceipal, and all sources. AI-powered semantic matching finds the best candidates with salary predictions.',
      icon: BriefcaseIcon,
      path: '/job-pipeline',
      color: 'from-blue-500 to-cyan-600',
      highlights: [
        'AI Semantic Matching',
        'Multi-Source Jobs',
        'Salary Predictions',
        'Candidate Tracking'
      ],
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-lg">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Recruitment Suite
                </h1>
                <p className="text-sm text-gray-600">
                  Powered by AI - Built for HR Excellence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ChartBarIcon className="h-5 w-5" />
              <span>Smart Hiring Tools</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Workflow
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the tool that fits your hiring needs. From resume analysis to complete recruitment management.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.path}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200"
              >
                {/* Badge */}
                {feature.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      feature.badge === 'New'
                        ? 'bg-blue-100 text-blue-800'
                        : feature.badge === 'Beta'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {feature.badge}
                    </span>
                  </div>
                )}

                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {feature.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`} />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => navigate(feature.path)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r ${feature.color} text-white hover:shadow-lg hover:scale-105`}
                  >
                    {feature.badge ? `Launch ${feature.title}` : `Launch ${feature.title}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">AI-Powered</div>
              <div className="text-gray-600">Smart Resume Analysis</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">Fast</div>
              <div className="text-gray-600">Instant Results</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Accurate</div>
              <div className="text-gray-600">Data-Driven Insights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Built with React & TypeScript | Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
