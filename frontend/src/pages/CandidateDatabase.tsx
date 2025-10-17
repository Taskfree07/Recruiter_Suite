import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface Candidate {
  _id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    currentCompany?: string;
  };
  professionalDetails: {
    totalExperience: number;
    currentJobTitle?: string;
    currentCTC?: string;
    expectedCTC?: string;
    noticePeriod?: string;
  };
  skills: {
    primary: string[];
    secondary: string[];
    frameworks: string[];
    databases: string[];
    cloudPlatforms: string[];
    tools: string[];
  };
  categories: {
    primaryCategory: string;
    specificSkills: string[];
    experienceLevel: string;
  };
  source: {
    type: string;
    email?: string;
    subject?: string;
    receivedDate?: Date;
  };
  file: {
    fileName: string;
    filePath: string;
    fileType: string;
  };
  scores: {
    overall: number;
    skillRelevance: number;
    experienceQuality: number;
  };
  status: string;
  createdAt: Date;
}

interface Stats {
  totalResumes: number;
  receivedToday: number;
  receivedThisWeek: number;
  pendingReview: number;
  topRated: number;
  topSkills: Array<{ _id: string; count: number }>;
}

const CandidateDatabase: React.FC = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSource, setUploadSource] = useState<'email' | 'portal' | 'manual'>('manual');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchCandidates();
    fetchStats();
  }, [sourceFilter, statusFilter, experienceFilter]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (experienceFilter !== 'all') params.experienceLevel = experienceFilter;

      const response = await axios.get(`${API_URL}/recruiter/resumes`, { params });
      setCandidates(response.data.resumes);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/recruiter/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select at least one resume file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      Array.from(selectedFiles).forEach((file) => {
        formData.append('resumes', file);
      });
      formData.append('source', uploadSource);

      const response = await axios.post(
        `${API_URL}/recruiter/upload-resumes`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(`Successfully uploaded ${response.data.uploaded} resume(s)`);
      setShowUploadModal(false);
      setSelectedFiles(null);
      fetchCandidates();
      fetchStats();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload resumes');
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateEmailFetch = async () => {
    try {
      setUploading(true);

      const response = await axios.post(`${API_URL}/recruiter/seed-demo-candidates`);

      toast.success(`Successfully loaded ${response.data.count} demo candidates from various sources`);
      fetchCandidates();
      fetchStats();
    } catch (error: any) {
      console.error('Load demo candidates error:', error);
      toast.error(error.response?.data?.error || 'Failed to load demo candidates');
    } finally {
      setUploading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear ALL candidates from the database? This cannot be undone!')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/recruiter/resumes/clear-all`);
      toast.success('Database cleared successfully');
      fetchCandidates();
      fetchStats();
    } catch (error: any) {
      console.error('Clear database error:', error);
      toast.error('Failed to clear database');
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      candidate.personalInfo.name.toLowerCase().includes(searchLower) ||
      candidate.personalInfo.email?.toLowerCase().includes(searchLower) ||
      candidate.categories.specificSkills.some((skill) =>
        skill.toLowerCase().includes(searchLower)
      );

    const matchesSource =
      sourceFilter === 'all' || candidate.source.type === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="h-5 w-5 text-blue-600" />;
      case 'portal':
        return <GlobeAltIcon className="h-5 w-5 text-green-600" />;
      case 'manual':
        return <DocumentTextIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'portal':
        return 'bg-green-100 text-green-800';
      case 'manual':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: Date) => {
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
                onClick={() => navigate('/ceipal-jobs')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Candidate Database</h1>
                  <p className="text-sm text-gray-600">Manage resumes from emails, portals, and uploads</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSimulateEmailFetch}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                disabled={uploading}
              >
                <UserGroupIcon className="h-5 w-5" />
                <span>Load Demo Candidates</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Upload Resumes</span>
              </button>
              <button
                onClick={fetchCandidates}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleClearDatabase}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5" />
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
              <div className="text-sm text-gray-600">Total Resumes</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalResumes}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Today</div>
              <div className="text-2xl font-bold text-blue-600">{stats.receivedToday}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">This Week</div>
              <div className="text-2xl font-bold text-green-600">{stats.receivedThisWeek}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Pending Review</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Top Rated (80+)</div>
              <div className="text-2xl font-bold text-purple-600">{stats.topRated}</div>
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
                  placeholder="Search by name, email, or skills..."
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
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="email">Email</option>
                <option value="portal">Job Portal</option>
                <option value="manual">Manual Upload</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Experience</option>
                <option value="Junior (0-2)">Junior (0-2)</option>
                <option value="Mid-Level (2-5)">Mid-Level (2-5)</option>
                <option value="Senior (5+)">Senior (5+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Candidates Found</h3>
            <p className="text-gray-600 mb-4">
              {candidates.length === 0
                ? 'No candidates in your database yet. Upload resumes or fetch from email.'
                : 'No candidates match your current filters. Try adjusting your search.'}
            </p>
            {candidates.length === 0 && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Resumes
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {candidate.personalInfo.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          candidate.status
                        )}`}
                      >
                        {candidate.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(
                          candidate.source.type
                        )}`}
                      >
                        <div className="flex items-center space-x-1">
                          {getSourceIcon(candidate.source.type)}
                          <span>{candidate.source.type}</span>
                        </div>
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{candidate.personalInfo.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BriefcaseIcon className="h-4 w-4" />
                        <span>
                          {candidate.professionalDetails.totalExperience || 0} years exp
                        </span>
                      </div>
                      {candidate.professionalDetails.currentJobTitle && (
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">
                            {candidate.professionalDetails.currentJobTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {candidate.categories.specificSkills.slice(0, 8).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.categories.specificSkills.length > 8 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{candidate.categories.specificSkills.length - 8} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Added {formatDate(candidate.createdAt)}</span>
                      {candidate.source.receivedDate && (
                        <>
                          <span>•</span>
                          <span>Received {formatDate(candidate.source.receivedDate)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Score: {candidate.scores.overall}/100</span>
                      {candidate.professionalDetails.noticePeriod && (
                        <>
                          <span>•</span>
                          <span>Notice: {candidate.professionalDetails.noticePeriod}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          candidate.scores.overall >= 80
                            ? 'text-green-600'
                            : candidate.scores.overall >= 60
                            ? 'text-blue-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {candidate.scores.overall}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Resumes</h2>

            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadSource('email')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      uploadSource === 'email'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <EnvelopeIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Email</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSource('portal')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      uploadSource === 'portal'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <GlobeAltIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-sm font-medium">Job Portal</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSource('manual')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      uploadSource === 'manual'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Manual</div>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Resume Files (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {selectedFiles && (
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={uploading || !selectedFiles}
                >
                  {uploading ? 'Uploading...' : 'Upload Resumes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedCandidate.personalInfo.name}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedCandidate.status
                      )}`}
                    >
                      {selectedCandidate.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(
                        selectedCandidate.source.type
                      )}`}
                    >
                      Source: {selectedCandidate.source.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium">{selectedCandidate.personalInfo.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-medium">{selectedCandidate.personalInfo.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="font-medium">
                    {selectedCandidate.personalInfo.location || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Experience</p>
                  <p className="font-medium">
                    {selectedCandidate.professionalDetails.totalExperience || 0} years
                  </p>
                </div>
                {selectedCandidate.professionalDetails.currentJobTitle && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Role</p>
                    <p className="font-medium">
                      {selectedCandidate.professionalDetails.currentJobTitle}
                    </p>
                  </div>
                )}
                {selectedCandidate.professionalDetails.noticePeriod && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notice Period</p>
                    <p className="font-medium">
                      {selectedCandidate.professionalDetails.noticePeriod}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Primary Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.primary.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCandidate.skills.frameworks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Frameworks</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.frameworks.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Overall</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedCandidate.scores.overall}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Skill Relevance</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedCandidate.scores.skillRelevance}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Experience Quality</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedCandidate.scores.experienceQuality}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  File: {selectedCandidate.file.fileName}
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
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

export default CandidateDatabase;
