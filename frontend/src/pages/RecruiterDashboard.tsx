import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  ArrowPathIcon,
  BriefcaseIcon,
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

const RecruiterDashboard: React.FC = () => {
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
  const [processingEmail, setProcessingEmail] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoAvailable, setIsDemoAvailable] = useState(false);

  // Fetch dashboard stats and Outlook status
  useEffect(() => {
    fetchStats();
    fetchCategories();
    checkOutlookStatus();

    // Check for OAuth callback params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('outlook_connected') === 'true') {
      const email = urlParams.get('email');
      alert(`✅ Outlook connected successfully!\n\nAccount: ${email}\n\nYou can now sync emails automatically.`);
      setOutlookConnected(true);
      setOutlookEmail(email);
      // Clean up URL
      window.history.replaceState({}, '', '/recruiter-dashboard');
    } else if (urlParams.get('outlook_error')) {
      alert('❌ Failed to connect Outlook. Please try again.');
      window.history.replaceState({}, '', '/recruiter-dashboard');
    }
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

  const handleSimulateEmailFetch = async () => {
    const folderPath = prompt('Enter folder path containing resume PDFs:');
    if (!folderPath) return;

    try {
      setUploadingFiles(true);
      await axios.post(`${API_URL}/recruiter/email/simulate-fetch`, {
        folderPath
      });

      alert('Successfully fetched resumes from folder!');
      fetchStats();
      fetchCategories();
      fetchRecentResumes();
    } catch (error: any) {
      console.error('Error simulating email fetch:', error);
      alert(error.response?.data?.error || 'Error fetching resumes. Please check the folder path.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const checkOutlookStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/outlook/status`);
      if (response.data.connected) {
        setOutlookConnected(true);
        setOutlookEmail(response.data.emailAddress);
        setIsDemoMode(response.data.isDemo || false);
      }
      setIsDemoAvailable(response.data.isDemoAvailable || false);
    } catch (error) {
      console.error('Error checking Outlook status:', error);
    }
  };

  const handleConnectOutlook = async () => {
    // If Azure AD is not configured, offer demo mode
    if (isDemoAvailable) {
      const useDemo = window.confirm(
        '🎭 Demo Mode Available\n\n' +
        'Azure AD credentials are not configured.\n\n' +
        'Click OK to try Demo Mode (simulated emails with AI parsing)\n' +
        'Click Cancel to set up real Outlook integration first'
      );

      if (useDemo) {
        await handleConnectDemo();
        return;
      } else {
        alert(
          'To connect real Outlook:\n\n' +
          '1. Set up Azure AD app (see OUTLOOK_INTEGRATION_SETUP.md)\n' +
          '2. Add OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET to .env\n' +
          '3. Restart backend server\n' +
          '4. Try connecting again'
        );
        return;
      }
    }

    try {
      const response = await axios.get(`${API_URL}/outlook/auth-url`);
      if (response.data.success) {
        // Redirect to Microsoft OAuth page
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      console.error('Error connecting Outlook:', error);
      alert('Failed to connect Outlook. Please check your configuration.');
    }
  };

  const handleConnectDemo = async () => {
    try {
      const response = await axios.post(`${API_URL}/outlook/connect-demo`, {
        emailAddress: 'demo@outlook.com'
      });

      if (response.data.success) {
        alert(
          '🎭 Demo Mode Connected!\n\n' +
          `Email: ${response.data.emailAddress}\n\n` +
          'You can now sync demo emails with realistic job descriptions.\n' +
          'No Azure AD setup required!'
        );
        setOutlookConnected(true);
        setOutlookEmail(response.data.emailAddress);
        setIsDemoMode(true);
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error connecting demo:', error);
      alert('Failed to connect in demo mode.');
    }
  };

  const handleSyncOutlook = async () => {
    if (!outlookConnected) {
      alert('Please connect your Outlook account first.');
      return;
    }

    try {
      setSyncing(true);
      const response = await axios.post(`${API_URL}/outlook/sync`);

      if (response.data.success) {
        const demoNote = response.data.isDemo ? '\n\n🎭 Demo Mode - Simulated Data' : '';
        alert(
          `✅ Email Sync Complete!${demoNote}\n\n` +
          `Jobs Found: ${response.data.jobsProcessed}\n` +
          `Resumes Found: ${response.data.resumesProcessed}\n\n` +
          `${response.data.errors && response.data.errors.length > 0 ?
            `Errors: ${response.data.errors.length}` : 'No errors!'}`
        );
        fetchStats();
        fetchCategories();
        fetchRecentResumes();
      }
    } catch (error: any) {
      console.error('Error syncing Outlook:', error);
      alert(error.response?.data?.error || 'Failed to sync emails. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectOutlook = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Outlook account?')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/outlook/disconnect`);
      setOutlookConnected(false);
      setOutlookEmail(null);
      alert('Outlook account disconnected successfully.');
    } catch (error: any) {
      console.error('Error disconnecting Outlook:', error);
      alert('Failed to disconnect Outlook.');
    }
  };

  const handleEmailIntegration = async () => {
    // If not connected, show connection option
    if (!outlookConnected) {
      const choice = window.confirm(
        'Outlook Account Not Connected\n\n' +
        'Click OK to connect your Outlook account for automatic email syncing.\n' +
        'Click Cancel to manually paste an email instead.'
      );

      if (choice) {
        handleConnectOutlook();
        return;
      }
    }

    // Manual paste option
    const emailContent = prompt(
      outlookConnected ?
        'Paste email content for quick parsing:\n\n(Or click "Sync Outlook" to fetch automatically)' :
        'Paste the email content containing the job description:'
    );

    if (!emailContent || emailContent.trim().length === 0) return;

    try {
      setProcessingEmail(true);
      const response = await axios.post(`${API_URL}/recruiter/email/parse-job`, {
        emailContent
      });

      if (response.data.success) {
        alert(
          `Job Description Extracted Successfully!\n\n` +
          `Title: ${response.data.job.title}\n` +
          `Company: ${response.data.job.company}\n` +
          `Location: ${response.data.job.location}\n` +
          `Required Skills: ${response.data.job.requiredSkills.join(', ')}\n\n` +
          `This job has been saved and can be used for candidate matching!`
        );
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error parsing email:', error);
      alert(
        'Error parsing job description from email.\n\n' +
        (error.response?.data?.error || 'Please make sure the email contains a valid job description.')
      );
    } finally {
      setProcessingEmail(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
                <p className="text-sm text-gray-600">Skill-based Resume Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/outlook-jobs')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="View Outlook synced jobs and matched candidates"
              >
                <BriefcaseIcon className="h-5 w-5" />
                <span>View Jobs</span>
              </button>

              <button
                onClick={() => navigate('/ceipal-settings')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Configure Ceipal integration"
              >
                <StarIcon className="h-5 w-5" />
                <span>Ceipal</span>
              </button>

              {outlookConnected ? (
                <>
                  <button
                    onClick={handleSyncOutlook}
                    disabled={syncing}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors ${
                      isDemoMode
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    title={isDemoMode ? 'Sync demo emails (4 jobs, 2 resumes)' : `Sync emails from ${outlookEmail}`}
                  >
                    <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Syncing...' : isDemoMode ? 'Sync Demo' : 'Sync Outlook'}</span>
                  </button>
                  <button
                    onClick={handleDisconnectOutlook}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title={isDemoMode ? `Demo Mode: ${outlookEmail}` : `Connected: ${outlookEmail}`}
                  >
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>{isDemoMode ? '🎭 Demo' : 'Connected'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectOutlook}
                  disabled={processingEmail}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  title={isDemoAvailable ? "Connect Outlook (Demo mode available)" : "Connect Outlook to fetch job descriptions automatically"}
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  <span>{processingEmail ? 'Processing...' : 'Connect Outlook'}</span>
                  {isDemoAvailable && (
                    <span className="ml-1 px-2 py-0.5 bg-amber-500 text-xs rounded-full">Demo</span>
                  )}
                </button>
              )}

              <button
                onClick={handleRefreshData}
                disabled={loading || uploadingFiles}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                title="Refresh data from database"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleSimulateEmailFetch}
                disabled={uploadingFiles}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <EnvelopeIcon className="h-5 w-5" />
                <span>Fetch from Folder</span>
              </button>

              <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                <CloudArrowUpIcon className="h-5 w-5" />
                <span>{uploadingFiles ? 'Uploading...' : 'Upload Resumes'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles}
                />
              </label>

              <button
                onClick={handleClearAllData}
                disabled={loading || uploadingFiles}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                title="Clear all resume data from database"
              >
                <XCircleIcon className="h-5 w-5" />
                <span>Clear All Data</span>
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
              <div className="text-sm text-gray-600">This Week</div>
              <div className="text-2xl font-bold text-blue-600">{stats.receivedThisWeek}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Today</div>
              <div className="text-2xl font-bold text-green-600">{stats.receivedToday}</div>
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

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Date:</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Received Date</option>
                <option value="score">Score</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Newest First / Highest First</option>
                <option value="asc">Oldest First / Lowest First</option>
              </select>
            </div>

            {/* Active Filters Count */}
            {(dateFilter !== 'all' || selectedCategory || selectedSkill) && (
              <div className="ml-auto flex items-center space-x-2">
                <span className="text-sm text-blue-600 font-medium">
                  {[dateFilter !== 'all', selectedCategory, selectedSkill].filter(Boolean).length} active filter(s)
                </span>
                <button
                  onClick={() => {
                    setDateFilter('all');
                    setSelectedCategory(null);
                    setSelectedSkill(null);
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skill Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => {
                  setSelectedCategory(category._id);
                  setSelectedSkill(null);
                }}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-all p-4 text-left ${
                  selectedCategory === category._id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getCategoryIcon(category._id)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category._id}</h3>
                      <p className="text-sm text-gray-600">{category.count} resumes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Avg Score</div>
                    <div className={`text-lg font-bold ${getScoreColor(category.avgScore)}`}>
                      {Math.round(category.avgScore)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Latest: {formatDate(category.latestResume)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resumes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? `${selectedCategory} Resumes` : 'Recent Resumes'}
            </h2>
            {(selectedCategory || selectedSkill) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSkill(null);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading resumes...</div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No resumes found. Upload or fetch resumes to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div key={resume._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {resume.personalInfo.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(resume.scores.overall)}`}>
                          Score: {resume.scores.overall}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                        {resume.personalInfo.email && (
                          <span>✉️ {resume.personalInfo.email}</span>
                        )}
                        {resume.personalInfo.phone && (
                          <span>📞 {resume.personalInfo.phone}</span>
                        )}
                        {resume.personalInfo.location && (
                          <span>📍 {resume.personalInfo.location}</span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="text-gray-700">
                          💼 {resume.professionalDetails.totalExperience} years exp
                        </span>
                        {resume.professionalDetails.noticePeriod && (
                          <span className="text-gray-700">
                            ⏰ {resume.professionalDetails.noticePeriod}
                          </span>
                        )}
                        {resume.personalInfo.currentCompany && (
                          <span className="text-gray-700">
                            🏢 {resume.personalInfo.currentCompany}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {resume.categories.specificSkills.slice(0, 8).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {resume.source.type === 'email' ? '📧 Email' : '📤 Manual Upload'}
                        </span>
                        <span>•</span>
                        <span className="font-medium">
                          Received: {resume.source.receivedDate ? formatDate(resume.source.receivedDate) : formatDate(resume.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{resume.categories.experienceLevel}</span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
