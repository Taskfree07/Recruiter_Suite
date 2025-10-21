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
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface CeipalConfig {
  apiKey: string;
  apiUrl: string;
  mockMode: boolean;
  syncEnabled: boolean;
  syncInterval: number;
  syncJobs: boolean;
  syncCandidates: boolean;
  syncApplications: boolean;
  connectionStatus: string;
  lastSyncDate?: string;
  lastError?: string;
}

const CeipalSettings: React.FC = () => {
  const navigate = useNavigate();

  const [config, setConfig] = useState<CeipalConfig>({
    apiKey: 'MOCK_API_KEY',
    apiUrl: 'https://api.ceipal.com/v1',
    mockMode: true,
    syncEnabled: false,
    syncInterval: 30,
    syncJobs: true,
    syncCandidates: true,
    syncApplications: true,
    connectionStatus: 'disconnected'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
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
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/ceipal/config`, config);
      showMessage('success', 'Configuration saved successfully!');
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
      const response = await axios.post(`${API_URL}/ceipal/test-connection`);

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

  const handleSyncJobs = async () => {
    try {
      setSyncing(true);
      const response = await axios.post(`${API_URL}/ceipal/sync-jobs`);

      if (response.data.success) {
        const { added, updated, total } = response.data.stats;
        showMessage('success', `Synced ${total} jobs! ${added} new, ${updated} updated.`);
        fetchConfig(); // Refresh config
      } else {
        showMessage('error', 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      showMessage('error', error.response?.data?.error || 'Sync failed');
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
                <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Ceipal Settings</h1>
                  <p className="text-sm text-gray-600">Configure your Ceipal ATS integration</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connection Settings</h2>

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

            {/* API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                disabled={config.mockMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="https://api.ceipal.com/v1"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key {config.mockMode && <span className="text-xs text-gray-500">(not needed in mock mode)</span>}
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                disabled={config.mockMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Enter your Ceipal API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key is encrypted and stored securely
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

        {/* Sync Settings Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sync Settings</h2>

          <div className="space-y-4">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Auto-Sync</label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically sync data at regular intervals
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.syncEnabled}
                  onChange={(e) => setConfig({ ...config, syncEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Sync Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                value={config.syncInterval}
                onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) })}
                min="5"
                max="1440"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* What to Sync */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">What to Sync</label>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="syncJobs"
                  checked={config.syncJobs}
                  onChange={(e) => setConfig({ ...config, syncJobs: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="syncJobs" className="text-sm text-gray-700">
                  Job Postings
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="syncCandidates"
                  checked={config.syncCandidates}
                  onChange={(e) => setConfig({ ...config, syncCandidates: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="syncCandidates" className="text-sm text-gray-700">
                  Candidates (Coming Soon)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="syncApplications"
                  checked={config.syncApplications}
                  onChange={(e) => setConfig({ ...config, syncApplications: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="syncApplications" className="text-sm text-gray-700">
                  Applications (Coming Soon)
                </label>
              </div>
            </div>

            {/* Last Sync */}
            {config.lastSyncDate && (
              <div className="text-sm text-gray-600 pt-4 border-t">
                Last synced: {new Date(config.lastSyncDate).toLocaleString()}
              </div>
            )}

            {/* Manual Sync and View Jobs Buttons */}
            <div className="pt-4 flex space-x-3">
              <button
                onClick={handleSyncJobs}
                disabled={syncing}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    <span>Sync Now</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/ceipal-jobs')}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>View Synced Jobs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Mock Mode:</strong> Perfect for testing without real API access</li>
            <li>• <strong>Real API:</strong> Disable mock mode and enter your Ceipal API credentials</li>
            <li>• <strong>Sync:</strong> Click "Sync Now" to import jobs from Ceipal</li>
            <li>• <strong>Auto-Sync:</strong> Enable to automatically sync at regular intervals</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CeipalSettings;
