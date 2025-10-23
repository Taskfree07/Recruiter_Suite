import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BriefcaseIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface SalaryData {
  source: string;
  min: number;
  max: number;
  average: number;
  url?: string;
  logo?: string;
}

interface PredictionResult {
  jobTitle: string;
  location: string;
  experienceYears: number;
  overallAverage: number;
  overallMin: number;
  overallMax: number;
  median: number;
  percentile75: number;
  percentile90: number;
  sources: SalaryData[];
  recommendations: string[];
  costOfLivingIndex: number;
}

const SalaryPredictor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [skills, setSkills] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobTitle || !location) {
      setError('Please fill in Job Title and Location');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/api/salary/predict`, {
        jobTitle,
        location,
        experienceYears,
        skills: skills.split(',').map(s => s.trim()).filter(s => s),
      });

      setResult(response.data.prediction);
    } catch (err: any) {
      console.error('Error predicting salary:', err);
      setError(err.response?.data?.error || 'Failed to predict salary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSourceLogo = (source: string) => {
    const logos: Record<string, string> = {
      indeed: '🔵',
      glassdoor: '🟢',
      ziprecruiter: '🟠',
      salary: '💰',
      payscale: '📊',
      bls: '🏛️',
    };
    return logos[source.toLowerCase()] || '💼';
  };

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
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-2 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    Salary Predictor
                    <span className="ml-3 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <SparklesIcon className="w-3 h-3 inline mr-1" />
                      AI-Powered
                    </span>
                  </h1>
                  <p className="text-sm text-gray-600">
                    Get accurate salary ranges from multiple sources
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-green-600" />
              Enter Job Details
            </h2>

            <form onSubmit={handlePredict} className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer, Data Scientist"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA or New York, NY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChartBarIcon className="h-4 w-4 inline mr-1" />
                  Years of Experience: {experienceYears}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Entry (0-2)</span>
                  <span>Mid (3-5)</span>
                  <span>Senior (6-10)</span>
                  <span>Lead (10+)</span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <SparklesIcon className="h-4 w-4 inline mr-1" />
                  Skills (Optional)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., Python, React, AWS (comma-separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add specific skills to get more accurate predictions
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing Salaries...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Predict Salary
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {!result ? (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center py-12">
                  <CurrencyDollarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Ready to predict salary
                  </h3>
                  <p className="text-gray-500">
                    Enter job details on the left to see salary predictions from multiple sources
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Overall Prediction */}
                <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Overall Prediction</h3>
                    <ArrowTrendingUpIcon className="h-8 w-8" />
                  </div>

                  <div className="mb-6">
                    <p className="text-sm opacity-90 mb-1">{result.jobTitle}</p>
                    <p className="text-sm opacity-90 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {result.location} · {result.experienceYears} years exp
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm opacity-90">Salary Range</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(result.overallMin)} - {formatCurrency(result.overallMax)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-90">Average Salary</p>
                      <p className="text-3xl font-bold">{formatCurrency(result.overallAverage)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
                    <div>
                      <p className="text-xs opacity-75">Median</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.median)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">75th %ile</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.percentile75)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">90th %ile</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.percentile90)}</p>
                    </div>
                  </div>

                  {result.costOfLivingIndex && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-xs opacity-75">Cost of Living Index</p>
                      <p className="text-sm">{result.costOfLivingIndex} (National avg: 100)</p>
                    </div>
                  )}
                </div>

                {/* Source Breakdown */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Data Sources ({result.sources.length})
                  </h3>

                  <div className="space-y-3">
                    {result.sources.map((source, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{getSourceLogo(source.source)}</span>
                            <span className="font-semibold text-gray-900 capitalize">
                              {source.source}
                            </span>
                          </div>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              View Source →
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Min</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(source.min)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(source.average)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Max</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(source.max)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-xl shadow-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      AI Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm text-blue-800">
                          <span className="text-blue-600 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryPredictor;
