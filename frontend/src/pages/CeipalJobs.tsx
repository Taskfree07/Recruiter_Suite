import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceYears: {
    min: number;
    max: number;
  };
  experienceLevel: string;
  location: string;
  locationType: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  status: string;
  postedDate: string;
  positions: number;
  department: string;
  priority: string;
  applicationsCount: number;
  viewsCount: number;
}

interface Stats {
  totalJobs: number;
  openJobs: number;
  filledJobs: number;
  jobsByLevel: Array<{ _id: string; count: number }>;
  topSkills: Array<{ _id: string; count: number }>;
}

const CeipalJobs: React.FC = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [statusFilter, levelFilter, locationTypeFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (levelFilter !== 'all') params.experienceLevel = levelFilter;
      if (locationTypeFilter !== 'all') params.locationType = locationTypeFilter;

      const response = await axios.get(`${API_URL}/ceipal/jobs`, { params });
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/ceipal/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = () => {
    fetchJobs();
    fetchStats();
  };

  const handleViewJob = async (job: Job) => {
    try {
      // Increment view count
      await axios.get(`${API_URL}/ceipal/jobs/${job._id}`);
      setSelectedJob(job);
    } catch (error) {
      console.error('Error viewing job:', error);
    }
  };

  const handleViewMatchingCandidates = async (job: Job, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent job modal from opening
    try {
      setLoadingMatches(true);
      setSelectedJob(job);
      setShowMatchModal(true);

      const response = await axios.get(`${API_URL}/matching/job/${job._id}/candidates`);
      setMatchingCandidates(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matching candidates:', error);
      alert('Error loading matching candidates. Please try again.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 65) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const badges: any = {
      excellent: { color: 'bg-green-100 text-green-800 border-green-300', text: 'Excellent Match', icon: '🌟' },
      good: { color: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Good Match', icon: '👍' },
      fair: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Fair Match', icon: '👌' },
      poor: { color: 'bg-gray-100 text-gray-800 border-gray-300', text: 'Poor Match', icon: '⚠️' }
    };
    const badge = badges[recommendation] || badges.poor;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.requiredSkills.some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'filled':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'junior':
        return 'bg-blue-100 text-blue-800';
      case 'mid':
        return 'bg-purple-100 text-purple-800';
      case 'senior':
        return 'bg-orange-100 text-orange-800';
      case 'lead':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    return `$${(salary.min / 1000).toFixed(0)}k - $${(salary.max / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/ceipal-settings')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Ceipal Jobs</h1>
                  <p className="text-sm text-gray-600">View and manage synced jobs from Ceipal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/candidate-database')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <UserGroupIcon className="h-5 w-5" />
                <span>Candidate Database</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Jobs</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Open Positions</div>
              <div className="text-2xl font-bold text-green-600">{stats.openJobs}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Filled Positions</div>
              <div className="text-2xl font-bold text-gray-600">{stats.filledJobs}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Junior/Mid</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.jobsByLevel.find(l => l._id === 'Junior')?.count || 0} / {stats.jobsByLevel.find(l => l._id === 'Mid')?.count || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Senior/Lead</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.jobsByLevel.find(l => l._id === 'Senior')?.count || 0} / {stats.jobsByLevel.find(l => l._id === 'Lead')?.count || 0}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="filled">Filled</option>
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>

              <select
                value={locationTypeFilter}
                onChange={(e) => setLocationTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="remote">Remote</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-600 mb-4">
              {jobs.length === 0
                ? 'No jobs have been synced yet. Go to Ceipal Settings to sync jobs.'
                : 'No jobs match your current filters. Try adjusting your search.'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => navigate('/ceipal-settings')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Ceipal Settings
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
                onClick={() => handleViewJob(job)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(job.experienceLevel)}`}>
                        {job.experienceLevel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{job.location}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs ml-1">
                          {job.locationType}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>{formatSalary(job.salaryRange)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{job.experienceYears.min}-{job.experienceYears.max} years</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Posted {formatDate(job.postedDate)}</span>
                      <span>•</span>
                      <span>{job.positions} position{job.positions > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{job.applicationsCount} applications</span>
                      <span>•</span>
                      <span>{job.viewsCount} views</span>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={(e) => handleViewMatchingCandidates(job, e)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      <UserGroupIcon className="h-4 w-4" />
                      <span>View Matching Candidates</span>
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedJob.experienceLevel)}`}>
                      {selectedJob.experienceLevel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company</p>
                  <p className="font-medium">{selectedJob.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="font-medium">{selectedJob.location} ({selectedJob.locationType})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Salary Range</p>
                  <p className="font-medium">{formatSalary(selectedJob.salaryRange)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Experience</p>
                  <p className="font-medium">{selectedJob.experienceYears.min}-{selectedJob.experienceYears.max} years</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedJob.niceToHaveSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Nice to Have Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.niceToHaveSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Posted {formatDate(selectedJob.postedDate)} • {selectedJob.applicationsCount} applications
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matching Candidates Modal */}
      {showMatchModal && selectedJob && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowMatchModal(false);
            setMatchingCandidates([]);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Matching Candidates
                  </h2>
                  <p className="text-gray-600">
                    For: <span className="font-semibold">{selectedJob.title}</span> at {selectedJob.company}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    setMatchingCandidates([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Loading State */}
              {loadingMatches ? (
                <div className="text-center py-12">
                  <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Finding matching candidates...</p>
                </div>
              ) : matchingCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Matching Candidates Found</h3>
                  <p className="text-gray-600">
                    No candidates in your database match this job's requirements (minimum 40% match score).
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Found <span className="font-bold">{matchingCandidates.length}</span> matching candidates
                      from your resume database (emails, LinkedIn, job portals)
                    </p>
                  </div>

                  {/* Candidates List */}
                  <div className="space-y-4">
                    {matchingCandidates.map((match, index) => (
                      <div
                        key={match.candidate._id}
                        className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                              <span className="text-blue-600 font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {match.candidate.personalInfo.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {match.candidate.personalInfo.email || 'No email'} • {' '}
                                {match.candidate.personalInfo.location || 'Location not specified'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-4 py-2 rounded-full text-lg font-bold ${getMatchScoreColor(match.matchScore.overall)}`}>
                              {match.matchScore.overall}%
                            </span>
                            {getRecommendationBadge(match.matchScore.recommendation)}
                          </div>
                        </div>

                        {/* Match Breakdown */}
                        <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Skills</p>
                            <p className="text-sm font-bold text-gray-900">
                              {match.matchScore.breakdown.skillMatch}/40
                            </p>
                            <p className="text-xs text-gray-500">
                              {match.matchScore.details.skillMatchRate}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Experience</p>
                            <p className="text-sm font-bold text-gray-900">
                              {match.matchScore.breakdown.experienceMatch}/30
                            </p>
                            <p className="text-xs text-gray-500">
                              {match.candidate.professionalDetails.totalExperience || 0} years
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Location</p>
                            <p className="text-sm font-bold text-gray-900">
                              {match.matchScore.breakdown.locationMatch}/15
                            </p>
                            <p className="text-xs text-gray-500">
                              {match.matchScore.details.locationCompatible ? '✓ Compatible' : '✗ Different'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Salary</p>
                            <p className="text-sm font-bold text-gray-900">
                              {match.matchScore.breakdown.salaryMatch}/15
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {match.matchScore.details.salaryAlignment}
                            </p>
                          </div>
                        </div>

                        {/* Matched Skills */}
                        {match.matchScore.matchedSkills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              ✓ Matched Skills ({match.matchScore.matchedSkills.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {match.matchScore.matchedSkills.map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center space-x-1"
                                >
                                  <CheckCircleIcon className="h-3 w-3" />
                                  <span>{skill}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {match.matchScore.missingSkills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              ✗ Missing Skills ({match.matchScore.missingSkills.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {match.matchScore.missingSkills.map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center space-x-1"
                                >
                                  <XCircleIcon className="h-3 w-3" />
                                  <span>{skill}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Details */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>Source: {match.candidate.source.type}</span>
                            {match.candidate.professionalDetails.noticePeriod && (
                              <>
                                <span>•</span>
                                <span>Notice: {match.candidate.professionalDetails.noticePeriod}</span>
                              </>
                            )}
                            {match.matchScore.experienceGap !== 0 && (
                              <>
                                <span>•</span>
                                <span className={match.matchScore.experienceGap < 0 ? 'text-orange-600' : 'text-blue-600'}>
                                  {match.matchScore.experienceGap < 0 ?
                                    `${Math.abs(match.matchScore.experienceGap)} years underqualified` :
                                    `${match.matchScore.experienceGap} years overqualified`
                                  }
                                </span>
                              </>
                            )}
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors">
                            Submit to Job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Candidates shown are from your resume database (emails, LinkedIn, job portals, etc.)
                </p>
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    setMatchingCandidates([]);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CeipalJobs;
