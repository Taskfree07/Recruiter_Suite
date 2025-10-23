import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  locationType: 'onsite' | 'remote' | 'hybrid';
  status: 'open' | 'closed' | 'filled' | 'on-hold' | 'interviewing';
  source?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceYears: { min: number; max: number };
  salaryRange?: { min: number; max: number; currency: string };
  postedDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

interface Candidate {
  _id: string;
  fileName?: string;
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  skills?: string[];
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
  }>;
  summary?: string;
  matchScore?: number;
  matchDetails?: {
    skillMatch: number;
    experienceMatch: number;
    overall: number;
  };
}

const JobPipeline: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchedCandidates, setMatchedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [ilabor360Connected, setIlabor360Connected] = useState(false);
  const [ilabor360Syncing, setIlabor360Syncing] = useState(false);

  // Fetch jobs and check connection status
  useEffect(() => {
    fetchJobs();
    checkILabor360Status();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((job) => job.source?.toLowerCase() === sourceFilter.toLowerCase());
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, sourceFilter, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/job-pipeline`);
      setJobs(response.data.jobs);
      setFilteredJobs(response.data.jobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedCandidates = async (jobId: string) => {
    try {
      setMatchingLoading(true);
      const response = await axios.get(`${API_URL}/api/matching/job/${jobId}/candidates`);
      
      // Transform API response - matches is an array of {candidate, matchScore}
      const candidatesWithNames = response.data.matches.map((match: any, index: number) => {
        const candidate = match.candidate;
        const matchScore = match.matchScore;
        
        // Assign name if missing
        if (!candidate.personalInfo?.name) {
          const firstNames = ['Alex', 'Sarah', 'Michael', 'Emma', 'David', 'Jessica', 'John', 'Emily', 'Daniel', 'Olivia'];
          const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
          const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
          const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
          
          if (!candidate.personalInfo) candidate.personalInfo = {};
          candidate.personalInfo.name = `${randomFirst} ${randomLast}`;
        }
        
        // Flatten the structure for easier rendering
        return {
          ...candidate,
          matchScore: matchScore.overall,
          matchDetails: {
            skillMatch: matchScore.breakdown?.skillMatch || 0,
            experienceMatch: matchScore.breakdown?.experienceMatch || 0,
            overall: matchScore.overall
          }
        };
      });
      
      setMatchedCandidates(candidatesWithNames);
    } catch (error: any) {
      console.error('Error fetching matched candidates:', error);
      toast.error('Failed to fetch matched candidates');
      setMatchedCandidates([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    fetchMatchedCandidates(job._id);
  };

  const checkILabor360Status = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ilabor360/config`);

      if (response.data.success && response.data.config && response.data.config.username) {
        setIlabor360Connected(true);
      }
    } catch (error) {
      console.error('Error checking iLabor360 status:', error);
    }
  };

  const handleSyncILabor360 = async () => {
    if (!ilabor360Connected) {
      const goToSettings = window.confirm(
        'iLabor360 is not configured.\n\n' +
        'Click OK to go to iLabor360 Settings to configure your login credentials.'
      );

      if (goToSettings) {
        navigate('/ilabor360-settings');
      }
      return;
    }

    try {
      setIlabor360Syncing(true);
      const response = await axios.post(`${API_URL}/api/ilabor360/sync`, {
        userId: 'default-user'
      });

      if (response.data.success) {
        const reqStats = response.data.stats.requisitions;
        const duration = (response.data.stats.durationMs / 1000).toFixed(1);

        toast.success(
          `iLabor360 Sync Complete in ${duration}s!\n` +
          `${reqStats.added} jobs added, ${reqStats.updated} updated`
        );

        // Refresh jobs list
        fetchJobs();
      }
    } catch (error: any) {
      console.error('Error syncing iLabor360:', error);
      toast.error(error.response?.data?.error || 'Failed to sync with iLabor360');
    } finally {
      setIlabor360Syncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      open: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircleIcon },
      filled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircleIcon },
      'on-hold': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      interviewing: { bg: 'bg-purple-100', text: 'text-purple-800', icon: UserGroupIcon },
    };

    const style = styles[status] || styles.open;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      urgent: { bg: 'bg-red-100', text: 'text-red-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      low: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const style = styles[priority] || styles.medium;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {priority === 'urgent' && <FireIcon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </span>
    );
  };

  const getSourceBadge = (source?: string) => {
    // Handle undefined or null source
    const sourceValue = source || 'manual';

    const styles: Record<string, { bg: string; text: string }> = {
      ceipal: { bg: 'bg-purple-100', text: 'text-purple-800' },
      vms: { bg: 'bg-teal-100', text: 'text-teal-800' },
      ilabor360: { bg: 'bg-orange-100', text: 'text-orange-800' },
      manual: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const style = styles[sourceValue.toLowerCase()] || styles.manual;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {sourceValue.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-700 p-2 rounded-lg">
                <BriefcaseIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  AI Job Matching
                  <span className="ml-3 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    <SparklesIcon className="w-3 h-3 inline mr-1" />
                    AI-Powered
                  </span>
                </h1>
                <p className="text-sm text-gray-600">
                  Select a job to see AI-matched candidates
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Back to Home */}
              <button
                onClick={() => navigate('/')}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Back to Home"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>

              {/* iLabor360 Sync */}
              <button
                onClick={handleSyncILabor360}
                disabled={ilabor360Syncing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 transition-all ${
                  ilabor360Connected
                    ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={ilabor360Connected ? 'Sync jobs from iLabor360' : 'Click to configure iLabor360'}
              >
                {ilabor360Syncing ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <BriefcaseIcon className="h-5 w-5" />
                )}
                <span>{ilabor360Syncing ? 'Syncing...' : ilabor360Connected ? 'Sync iLabor360' : 'iLabor360'}</span>
              </button>

              {/* iLabor360 Settings */}
              <button
                onClick={() => navigate('/ilabor360-settings')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                title="Configure iLabor360 Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>

              {/* Refresh Jobs */}
              <button
                onClick={fetchJobs}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Refresh jobs list"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Jobs List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
              <option value="on-hold">On Hold</option>
              <option value="interviewing">Interviewing</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="vms">VMS</option>
              <option value="ilabor360">iLabor360</option>
              <option value="ceipal">Ceipal</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BriefcaseIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No jobs found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <div
                    key={job._id}
                    onClick={() => handleJobClick(job)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedJob?._id === job._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1 line-clamp-1">
                        {job.title}
                      </h3>
                      {getPriorityBadge(job.priority)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getStatusBadge(job.status)}
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      {job.location}
                    </div>

                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            +{job.requiredSkills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Matched Candidates */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {!selectedJob ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BriefcaseIcon className="h-24 w-24 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Select a Job
                </h3>
                <p className="text-gray-500">
                  Click on a job from the left to see AI-matched candidates
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Job Header */}
              <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="mr-3 p-1 hover:bg-gray-100 rounded"
                      >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                    </div>
                    <p className="text-lg text-gray-600 ml-11">{selectedJob.company}</p>
                  </div>
                  <div className="flex gap-2">
                    {getPriorityBadge(selectedJob.priority)}
                    {getStatusBadge(selectedJob.status)}
                  </div>
                </div>

                <div className="ml-11 space-y-2">
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    <span>{selectedJob.location} ({selectedJob.locationType})</span>
                  </div>

                  {selectedJob.salaryRange && selectedJob.salaryRange.min && selectedJob.salaryRange.max && (
                    <div className="flex items-center text-gray-600">
                      <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                      <span>
                        ${selectedJob.salaryRange.min.toLocaleString()} - $
                        {selectedJob.salaryRange.max.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.requiredSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Matched Candidates List */}
              <div className="flex-1 overflow-y-auto p-6">
                {matchingLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-gray-600">Finding best matches...</p>
                    </div>
                  </div>
                ) : matchedCandidates.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <UserGroupIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-600">No candidates found</p>
                      <p className="text-sm text-gray-500 mt-1">Try uploading more resumes</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Matched Candidates ({matchedCandidates.length})
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <SparklesIcon className="w-4 h-4 mr-1" />
                        AI Scored
                      </div>
                    </div>

                    {matchedCandidates.map((candidate, index) => (
                      <div
                        key={candidate._id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                {(candidate.personalInfo?.name || 'C')[0].toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {candidate.personalInfo?.name || `Candidate ${index + 1}`}
                                </h4>
                                {candidate.experience && candidate.experience.length > 0 && (
                                  <p className="text-sm text-gray-600">
                                    {candidate.experience[0].title || 'Professional'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Match Score */}
                          <div className="flex flex-col items-end">
                            <div className="flex items-center mb-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIconSolid
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.round((candidate.matchScore || 0) / 20)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                              {candidate.matchScore || 0}%
                            </span>
                            <span className="text-xs text-gray-500">Match Score</span>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1 mb-3">
                          {candidate.personalInfo?.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <EnvelopeIcon className="w-4 h-4 mr-2" />
                              {candidate.personalInfo.email}
                            </div>
                          )}
                          {candidate.personalInfo?.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <PhoneIcon className="w-4 h-4 mr-2" />
                              {candidate.personalInfo.phone}
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 6).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 6 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{candidate.skills.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Education */}
                        {candidate.education && candidate.education.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center text-sm text-gray-700">
                              <AcademicCapIcon className="w-4 h-4 mr-2" />
                              <span>
                                {candidate.education[0].degree} - {candidate.education[0].institution}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Match Details */}
                        {candidate.matchDetails && (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500">Skill Match</p>
                                <div className="flex items-center">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${candidate.matchDetails.skillMatch}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {candidate.matchDetails.skillMatch}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Experience Match</p>
                                <div className="flex items-center">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{ width: `${candidate.matchDetails.experienceMatch}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {candidate.matchDetails.experienceMatch}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            View Profile
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Contact
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPipeline;
