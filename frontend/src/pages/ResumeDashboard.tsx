import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface Resume {
  _id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    currentCompany?: string;
  };
  professionalDetails: {
    totalExperience: number;
    noticePeriod?: string;
  };
  skills: {
    primary: string[];
    frameworks: string[];
    databases: string[];
    cloudPlatforms: string[];
  };
  categories: {
    primaryCategory: string;
    specificSkills: string[];
    experienceLevel: string;
  };
  scores: {
    overall: number;
    skillRelevance: number;
    experienceQuality: number;
  };
  source: {
    type: string;
    email?: string;
    receivedDate?: string;
  };
  status: string;
  createdAt: string;
}

interface CategoryStats {
  _id: string;
  count: number;
  avgScore: number;
  latestResume: string;
}

interface DashboardStats {
  totalResumes: number;
  receivedToday: number;
  receivedThisWeek: number;
  pendingReview: number;
  topRated: number;
  topSkills: Array<{ _id: string; count: number }>;
}

const ResumeDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ceipalConnected, setCeipalConnected] = useState(false);
  const [ceipalSyncing, setCeipalSyncing] = useState(false);

  // Fetch dashboard stats and integration status
  useEffect(() => {
    fetchStats();
    fetchCategories();
    checkCeipalStatus();
  }, []);

  // Fetch resumes when filters change
  useEffect(() => {
    if (selectedCategory || selectedSkill) {
      fetchResumesByFilter();
    } else {
      fetchRecentResumes();
    }
  }, [selectedCategory, selectedSkill, dateFilter, sortBy, sortOrder]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/recruiter/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/recruiter/skills/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRecentResumes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/recruiter/resumes`, {
        params: {
          limit: 50,
          dateFilter,
          sortBy,
          sortOrder
        }
      });
      setResumes(response.data.resumes);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumesByFilter = async () => {
    try {
      setLoading(true);
      if (selectedSkill) {
        const response = await axios.get(`${API_URL}/recruiter/skills/${selectedSkill}/resumes`, {
          params: {
            dateFilter,
            sortBy,
            sortOrder
          }
        });
        setResumes(response.data.resumes);
      } else if (selectedCategory) {
        const response = await axios.get(`${API_URL}/recruiter/resumes`, {
          params: {
            category: selectedCategory,
            limit: 50,
            dateFilter,
            sortBy,
            sortOrder
          }
        });
        setResumes(response.data.resumes);
      }
    } catch (error) {
      console.error('Error fetching filtered resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('resumes', file);
    });

    try {
      setUploadingFiles(true);
      await axios.post(`${API_URL}/recruiter/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(`Successfully uploaded ${files.length} resume(s)!`);
      fetchStats();
      fetchCategories();
      fetchRecentResumes();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Ceipal Functions
  const checkCeipalStatus = async () => {
    try {
      const userId = 'default-user'; // Use actual user ID in production
      const response = await axios.get(`${API_URL}/ceipal/config`, {
        params: { userId }
      });

      if (response.data.config && response.data.config.isConfigured) {
        setCeipalConnected(true);
      }
    } catch (error) {
      console.error('Error checking Ceipal status:', error);
    }
  };

  const handleSyncCeipal = async () => {
    if (!ceipalConnected) {
      const goToSettings = window.confirm(
        'Ceipal is not configured.\n\n' +
        'Click OK to go to Ceipal Settings to configure your API credentials.'
      );

      if (goToSettings) {
        navigate('/ceipal-settings');
      }
      return;
    }

    try {
      setCeipalSyncing(true);
      const userId = 'default-user'; // Use actual user ID in production
      const response = await axios.post(`${API_URL}/ceipal/sync-jobs`, { userId });

      if (response.data.success) {
        alert(
          `✅ Ceipal Sync Complete!\n\n` +
          `Jobs Synced: ${response.data.jobsSynced || 0}\n` +
          `Candidates Synced: ${response.data.candidatesSynced || 0}\n\n` +
          `${response.data.errors && response.data.errors.length > 0 ?
            `Errors: ${response.data.errors.length}` : 'No errors!'}`
        );
        fetchStats();
        fetchCategories();
        fetchRecentResumes();
      }
    } catch (error: any) {
      console.error('Error syncing Ceipal:', error);
      alert(error.response?.data?.error || 'Failed to sync with Ceipal. Please check your configuration.');
    } finally {
      setCeipalSyncing(false);
    }
  };

  const handleClearAllData = async () => {
    const confirmation = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL resumes from the database!\n\n' +
      'This action cannot be undone. Are you sure you want to continue?'
    );

    if (!confirmation) return;

    const doubleCheck = window.confirm(
      '🚨 FINAL CONFIRMATION: Delete all resume data?\n\n' +
      'Click OK to permanently delete everything.'
    );

    if (!doubleCheck) return;

    try {
      setLoading(true);
      console.log('🗑️ Attempting to clear all data...');
      console.log('API URL:', `${API_URL}/recruiter/resumes/clear-all`);

      const response = await axios.delete(`${API_URL}/recruiter/resumes/clear-all`);

      console.log('✅ Delete response:', response.data);

      // Clear localStorage too
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('candidate') || key.includes('resume') || key.includes('job') || key.includes('ats')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem('managedCandidates');

      alert(`✅ Success! ${response.data.deletedCount} resume(s) deleted from database.`);

      // Refresh all data
      fetchStats();
      fetchCategories();
      setResumes([]);
      setSelectedCategory(null);
      setSelectedSkill(null);
    } catch (error: any) {
      console.error('❌ Error clearing data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      alert(`❌ Failed to clear data:\n\n${errorMsg}\n\nCheck the console for more details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    fetchStats();
    fetchCategories();
    if (selectedCategory || selectedSkill) {
      fetchResumesByFilter();
    } else {
      fetchRecentResumes();
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      'Backend Development': '⚙️',
      'Frontend Development': '🎨',
      'Full Stack Development': '💻',
      'Mobile Development': '📱',
      'DevOps & Cloud': '☁️',
      'Data & AI': '🤖',
      'QA & Testing': '🧪',
      'Database': '🗄️',
    };
    return icons[category] || '📄';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
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
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Resume Dashboard</h1>
                  <p className="text-sm text-gray-600">Manage and organize candidate resumes</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Job Pipeline */}
              <button
                onClick={() => navigate('/job-pipeline')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <BriefcaseIcon className="h-5 w-5" />
                <span>Job Pipeline</span>
              </button>

              {/* Ceipal Integration */}
              <button
                onClick={handleSyncCeipal}
                disabled={ceipalSyncing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 transition-all ${
                  ceipalConnected
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={ceipalConnected ? 'Sync candidates from Ceipal' : 'Click to configure Ceipal'}
              >
                <StarIcon className="h-5 w-5" />
                <span>{ceipalSyncing ? 'Syncing...' : ceipalConnected ? 'Sync Ceipal' : 'Ceipal'}</span>
              </button>

              {/* Upload */}
              <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                <CloudArrowUpIcon className="h-5 w-5" />
                <span>{uploadingFiles ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles}
                />
              </label>

              {/* Refresh */}
              <button
                onClick={handleRefreshData}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>

              {/* Clear Data */}
              <button
                onClick={handleClearAllData}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                title="Clear all data"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="grid grid-cols-5 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-xl font-bold text-gray-900">{stats.totalResumes}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">This Week</div>
                <div className="text-xl font-bold text-green-600">{stats.receivedThisWeek}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Today</div>
                <div className="text-xl font-bold text-purple-600">{stats.receivedToday}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Pending</div>
                <div className="text-xl font-bold text-yellow-600">{stats.pendingReview}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Top Rated</div>
                <div className="text-xl font-bold text-indigo-600">{stats.topRated}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Categories */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
              Categories
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* All Resumes */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSkill(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                !selectedCategory && !selectedSkill
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All Resumes</span>
                <span className="text-sm font-semibold">{stats?.totalResumes || 0}</span>
              </div>
            </button>

            <div className="pt-2 pb-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4">
                By Category
              </div>
            </div>

            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => {
                  setSelectedCategory(category._id);
                  setSelectedSkill(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category._id
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon(category._id)}</span>
                    <span className="text-sm font-medium">{category._id}</span>
                  </div>
                  <span className="text-xs font-semibold">{category.count}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Avg Score</span>
                  <span className={`font-semibold ${getScoreColor(category.avgScore)}`}>
                    {Math.round(category.avgScore)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Filter Controls */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest / Highest</option>
                <option value="asc">Oldest / Lowest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Content - Resumes List */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Search Bar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-600">
                {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}
              </div>
            </div>
          </div>

          {/* Resumes List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading resumes...</p>
                </div>
              </div>
            ) : resumes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No resumes found</h3>
                  <p className="text-gray-500 mb-6">Upload resumes or sync from Ceipal to get started</p>
                  <div className="flex gap-3 justify-center">
                    <label className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                      <CloudArrowUpIcon className="h-5 w-5" />
                      <span>Upload Resumes</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {!ceipalConnected && (
                      <button
                        onClick={() => navigate('/ceipal-settings')}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <StarIcon className="h-5 w-5" />
                        <span>Connect Ceipal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {resume.personalInfo.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {resume.personalInfo.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              {resume.professionalDetails.totalExperience && (
                                <span>💼 {resume.professionalDetails.totalExperience} years</span>
                              )}
                              {resume.categories.experienceLevel && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{resume.categories.experienceLevel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(resume.scores.overall)}`}>
                              {resume.scores.overall}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Score</div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                          {resume.personalInfo.email && (
                            <span className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {resume.personalInfo.email}
                            </span>
                          )}
                          {resume.personalInfo.phone && (
                            <span>📞 {resume.personalInfo.phone}</span>
                          )}
                          {resume.personalInfo.location && (
                            <span>📍 {resume.personalInfo.location}</span>
                          )}
                          {resume.personalInfo.currentCompany && (
                            <span>🏢 {resume.personalInfo.currentCompany}</span>
                          )}
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {resume.categories.specificSkills.slice(0, 8).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {resume.categories.specificSkills.length > 8 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              +{resume.categories.specificSkills.length - 8} more
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded ${
                              resume.source.type === 'email'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {resume.source.type === 'email' ? '📧 Email' : '📤 Upload'}
                            </span>
                            <span>{formatDate(resume.source.receivedDate || resume.createdAt)}</span>
                          </div>
                          <button
                            className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDashboard;
