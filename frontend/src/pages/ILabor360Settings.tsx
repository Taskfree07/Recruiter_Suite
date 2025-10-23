import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { iLabor360Service, ILabor360Config, SyncStats } from '../services/iLabor360Service';

const ILabor360Settings: React.FC = () => {
  const navigate = useNavigate();

  const [config, setConfig] = useState<Partial<ILabor360Config>>({
    username: '',
    password: '',
    loginUrl: 'https://vendor.ilabor360.com/logout',
    syncEnabled: true,
    syncInterval: 30,
    autoSync: false,
    maxRequisitionsPerSync: 100,
    maxSubmissionsPerSync: 100,
    connectionStatus: 'disconnected'
  });

  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await iLabor360Service.getConfig();
      if (response.success) {
        setConfig(response.config);
      }
    } catch (error: any) {
      console.error('Error fetching config:', error);
      showMessage('error', 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await iLabor360Service.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await iLabor360Service.updateConfig(config);
      
      if (response.success) {
        showMessage('success', 'Configuration saved successfully!');
        fetchConfig();
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      showMessage('error', error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    // Validate credentials
    if (!config.username || !config.password) {
      showMessage('error', 'Please enter username and password first');
      return;
    }

    try {
      setTesting(true);
      
      // Save configuration first to encrypt password
      showMessage('success', 'Saving configuration...');
      await iLabor360Service.updateConfig(config);
      
      // Show manual login instructions
      showMessage('success', '🪟 Opening browser window - Please complete login manually!');
      
      // Now test connection - this will open a browser window
      const response = await iLabor360Service.testConnection();

      if (response.success) {
        showMessage('success', '✅ ' + response.message);
        fetchConfig();
      } else {
        showMessage('error', 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Connection test failed';
      showMessage('error', '❌ ' + errorMsg);
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      showMessage('success', '🔄 Starting sync... A browser window will open for manual login.');
      
      const response = await iLabor360Service.sync();

      if (response.success) {
        const reqStats = response.stats.requisitions;
        const duration = (response.stats.durationMs / 1000).toFixed(1);
        
        showMessage(
          'success',
          `✅ Sync completed in ${duration}s! Jobs: ${reqStats.added} added, ${reqStats.updated} updated, ${reqStats.skipped} skipped. Check Job Pipeline to see them!`
        );
        
        fetchConfig();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      showMessage('error', error.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/recruiter-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">iLabor360 Integration</h1>
              <p className="mt-2 text-gray-600">
                Configure your iLabor360 connection and sync settings
              </p>
            </div>
            <CloudIcon className="h-16 w-16 text-orange-500" />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Connection Status Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
              <div className="mt-2 flex items-center">
                {config.connectionStatus === 'connected' ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Connected</span>
                  </>
                ) : config.connectionStatus === 'error' ? (
                  <>
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700 font-medium">Error</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Not Connected</span>
                  </>
                )}
              </div>
              {config.lastError && (
                <p className="mt-1 text-sm text-red-600">{config.lastError}</p>
              )}
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Last test: {formatDate(config.lastConnectionTest)}</p>
              <p>Last sync: {formatDate(config.lastSyncDate)}</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        {stats && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Jobs Synced</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {stats.totalRequisitionsSynced || 0}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Last Sync Count</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {stats.lastSyncRequisitionCount || 0}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Errors</div>
                <div className="text-2xl font-bold text-orange-900 mt-1">
                  {stats.errorCount || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Cog6ToothIcon className="h-6 w-6 mr-2" />
            Configuration
          </h2>

          <div className="space-y-6">
            {/* Credentials */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Login Credentials</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username / Email
                  </label>
                  <input
                    type="text"
                    value={config.username || ''}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Matt.s@techgene.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={config.password || ''}
                      onChange={(e) => setConfig({ ...config, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login URL
                  </label>
                  <input
                    type="text"
                    value={config.loginUrl || ''}
                    onChange={(e) => setConfig({ ...config, loginUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://vendor.ilabor360.com/logout"
                  />
                </div>
              </div>
            </div>

            {/* Sync Settings */}
            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Sync Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Sync</label>
                    <p className="text-sm text-gray-500">Allow syncing data from iLabor360</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, syncEnabled: !config.syncEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.syncEnabled ? 'bg-orange-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.syncEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto Sync</label>
                    <p className="text-sm text-gray-500">Automatically sync at intervals</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, autoSync: !config.autoSync })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoSync ? 'bg-orange-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoSync ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval (minutes)
                  </label>
                  <select
                    value={config.syncInterval || 30}
                    onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Jobs per Sync
                    </label>
                    <input
                      type="number"
                      value={config.maxRequisitionsPerSync || 100}
                      onChange={(e) => setConfig({ ...config, maxRequisitionsPerSync: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="10"
                      max="1000"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Number of job listings to fetch from iLabor360 (10-1000)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Login Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Manual Login Required</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>When you click "Test Connection":</p>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>A Chrome browser window will open automatically</li>
                  <li>Your username and password will be pre-filled</li>
                  <li><strong>You must click the LOGIN button manually</strong></li>
                  <li>The system will detect when you're logged in and continue automatically</li>
                </ol>
                <p className="mt-2"><strong>Important:</strong> Do not close the browser window - it will close automatically after verification!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testing || !config.username || !config.password}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {testing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CloudIcon className="h-5 w-5 mr-2" />
                  Test Connection
                </>
              )}
            </button>

            <button
              onClick={handleSync}
              disabled={syncing || config.connectionStatus !== 'connected'}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {syncing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Sync Now
                </>
              )}
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500 text-center">
            💡 Tip: Save configuration and test connection before syncing
          </p>
        </div>

        {/* Recent Syncs */}
        {stats && stats.recentSyncs && stats.recentSyncs.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2" />
              Recent Syncs
            </h2>
            <div className="space-y-3">
              {stats.recentSyncs.slice(0, 5).map((sync, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    {sync.status === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    ) : sync.status === 'partial' ? (
                      <XCircleIcon className="h-5 w-5 text-yellow-500 mr-3" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(sync.date)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        +{sync.requisitionsAdded} jobs added | {(sync.duration / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      sync.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : sync.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sync.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ILabor360Settings;
