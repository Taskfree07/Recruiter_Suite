import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface CeipalConfig {
  username?: string;
  password?: string;
  apiKey: string;
  accessToken?: string;
  resumeApiUrl?: string;
  mockMode: boolean;
  connectionStatus: string;
  lastSyncDate?: string;
  lastError?: string;
}

const CeipalSettings: React.FC = () => {
  const navigate = useNavigate();

  const [config, setConfig] = useState<CeipalConfig>({
    apiKey: 'MOCK_API_KEY',
    mockMode: true,
    connectionStatus: 'disconnected',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ceipal/config`);
      setConfig(response.data.config);
    } catch (error: any) {
      console.error('Error fetching config:', error);
      showMessage('error', 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/ceipal/config`, {
        userId: 'default-user',
        ...config
      });
      showMessage('success', 'Configuration saved successfully!');
      fetchConfig(); // Refresh to see saved values
    } catch (error: any) {
      console.error('Error saving config:', error);
      showMessage('error', error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);

      // First save the current config, then test
      await axios.post(`${API_URL}/ceipal/config`, {
        userId: 'default-user',
        ...config
      });

      const response = await axios.post(`${API_URL}/ceipal/test-connection`, {
        userId: 'default-user'
      });

      if (response.data.success) {
        showMessage('success', response.data.message);
        fetchConfig(); // Refresh config
      } else {
        showMessage('error', 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      showMessage('error', error.response?.data?.error || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncResumes = async () => {
    try {
      setSyncing(true);
      const response = await axios.post(`${API_URL}/ceipal/sync-resumes`, {
        userId: 'default-user'
      });

      if (response.data.success) {
        const { added, updated, total } = response.data.stats;
        showMessage('success', `Synced ${total} resumes! ${added} new, ${updated} updated.`);
        fetchConfig(); // Refresh config
      } else {
        showMessage('error', 'Resume sync failed');
      }
    } catch (error: any) {
      console.error('Resume sync failed:', error);
      showMessage('error', error.response?.data?.error || 'Resume sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = () => {
    const status = config.connectionStatus;
    if (status === 'connected') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Connected
        </span>
      );
    } else if (status === 'error') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-4 w-4 mr-1" />
          Error
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <CloudIcon className="h-4 w-4 mr-1" />
          Disconnected
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/resume-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Ceipal Resume Sync</h1>
                  <p className="text-sm text-gray-600">Configure Ceipal credentials to sync resumes</p>
                </div>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </header>

      {/* Message Banner */}
      {message && (
        <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <XCircleIcon className="h-5 w-5 mr-2" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions Banner */}
        {!config.mockMode && (!config.apiKey || config.apiKey === 'MOCK_API_KEY') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Cog6ToothIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-2">🔑 Setup Required: Get Your Ceipal API Key</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Log into your Ceipal account</li>
                  <li>Go to <strong>Settings → API</strong> (or similar section)</li>
                  <li>Find or generate your <strong>API Key</strong></li>
                  <li>Copy the entire API Key</li>
                  <li>Paste it in the "API Key / Access Token" field below</li>
                  <li>Click "Save Settings" then "Test Connection"</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Mock Mode Banner */}
        {config.mockMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CloudIcon className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">Mock Mode Active</h3>
                <p className="text-sm text-yellow-800">
                  You're currently using mock/demo data. When you have real Ceipal API credentials,
                  disable mock mode and enter your actual API key below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">API Credentials</h2>

          <div className="space-y-4">
            {/* Mock Mode Toggle */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <label className="text-sm font-medium text-gray-700">Mock/Demo Mode</label>
                <p className="text-xs text-gray-500 mt-1">
                  Use fake data for testing (no real API needed)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.mockMode}
                  onChange={(e) => setConfig({ ...config, mockMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* API Key / Access Token (Primary Method) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key / Access Token <span className="text-red-500">*</span>
                {config.mockMode && <span className="text-xs text-gray-500"> (disabled in mock mode)</span>}
              </label>
              <input
                type="password"
                value={config.apiKey !== 'MOCK_API_KEY' ? config.apiKey : (config.accessToken || '')}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value, accessToken: e.target.value })}
                disabled={config.mockMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Paste your Ceipal API Key here (from Ceipal Settings → API)"
              />
              <p className="text-xs text-blue-600 mt-1 font-medium">
                📍 Find this in: Ceipal Dashboard → Settings → API → Copy API Key
              </p>
            </div>

            {/* Optional: Username/Password */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Alternative: Username & Password (if you don't have an access token)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                    {config.mockMode && <span className="text-xs text-gray-500"> (disabled)</span>}
                  </label>
                  <input
                    type="text"
                    value={config.username || ''}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    disabled={config.mockMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="your.email@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                    {config.mockMode && <span className="text-xs text-gray-500"> (disabled)</span>}
                  </label>
                  <input
                    type="password"
                    value={config.password || ''}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    disabled={config.mockMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Your password"
                  />
                </div>
              </div>
            </div>

            {/* Resume API URL */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Resume API Configuration <span className="text-red-500">*</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume API URL <span className="text-red-500">*</span>
                  {config.mockMode && <span className="text-xs text-gray-500"> (disabled)</span>}
                </label>
                <input
                  type="text"
                  value={config.resumeApiUrl || ''}
                  onChange={(e) => setConfig({ ...config, resumeApiUrl: e.target.value })}
                  disabled={config.mockMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="e.g., https://api.ceipal.com/v1/resumes"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API endpoint configured for fetching resumes (this will also be used for authentication)
                </p>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>ℹ️ Authentication:</strong> The system will automatically use<br/>
                  <code className="bg-blue-100 px-1 py-0.5 rounded">https://api.ceipal.com/v1/createAuthtoken/</code><br/>
                  to generate access tokens for all users.
                </p>
              </div>

              <p className="text-xs text-blue-600 font-medium mt-3">
                📍 Get your Resume API URL from your Ceipal API configuration
              </p>
            </div>

            {/* Last Error */}
            {config.lastError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Last Error:</strong> {config.lastError}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CloudIcon className="h-5 w-5" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Resume Sync Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resume Sync</h2>

          <div className="space-y-4">
            {/* Last Sync */}
            {config.lastSyncDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Last synced:</strong> {new Date(config.lastSyncDate).toLocaleString()}
                </p>
              </div>
            )}

            {/* Manual Sync Button */}
            <div className="pt-4">
              <button
                onClick={handleSyncResumes}
                disabled={syncing || config.mockMode}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center font-semibold text-lg"
              >
                {syncing ? (
                  <>
                    <ArrowPathIcon className="h-6 w-6 animate-spin" />
                    <span>Syncing Resumes...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-6 w-6" />
                    <span>Sync Resumes Now</span>
                  </>
                )}
              </button>
              {config.mockMode && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Disable mock mode and configure your credentials to sync resumes
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">📚 How to Setup Resume Sync</h3>
          <ol className="space-y-2 text-sm text-purple-800 list-decimal list-inside">
            <li><strong>Get API Credentials:</strong> Login to Ceipal → Settings → API Configuration</li>
            <li><strong>Disable Mock Mode:</strong> Turn off the mock mode toggle above</li>
            <li><strong>Enter Required Fields:</strong>
              <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                <li><strong>API Key:</strong> Your Ceipal API Key</li>
                <li><strong>Email/Username:</strong> Your Ceipal login email</li>
                <li><strong>Password:</strong> Your Ceipal login password</li>
                <li><strong>Resume API URL:</strong> Your configured resume endpoint URL</li>
              </ul>
            </li>
            <li><strong>Save & Test:</strong> Click "Save Settings" then "Test Connection"</li>
            <li><strong>Sync Resumes:</strong> Once connected, click "Sync Resumes Now" to import all resumes</li>
          </ol>

          <div className="mt-4 pt-4 border-t border-purple-300">
            <p className="text-xs text-purple-700">
              <strong>🔐 Authentication Flow:</strong>
              <br/>1. System sends credentials to: <code className="bg-purple-100 px-1 rounded">https://api.ceipal.com/v1/createAuthtoken/</code>
              <br/>2. Receives access token from Ceipal
              <br/>3. Uses token to fetch resumes from your Resume API URL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeipalSettings;
