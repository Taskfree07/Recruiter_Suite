import express, { Request, Response } from 'express';
import outlookService from '../services/outlookService';
import outlookDemoService from '../services/outlookDemoService';
import OutlookConfig from '../models/outlookConfig';

const router = express.Router();

// Check if demo mode is enabled (when Azure AD credentials are not configured)
const isDemoModeEnabled = !process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET;

/**
 * GET /api/outlook/auth-url
 * Get OAuth authorization URL for user to login
 */
router.get('/auth-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUrl = outlookService.getAuthUrl();

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authorize Outlook access'
    });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate authorization URL'
    });
  }
});

/**
 * GET /api/outlook/callback
 * OAuth callback - exchange code for token
 */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      res.redirect(`${process.env.FRONTEND_URL}/recruiter-dashboard?outlook_error=${error}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Authorization code not provided' });
      return;
    }

    console.log('📧 Exchanging authorization code for access token...');

    // Exchange code for token
    const tokenData = await outlookService.exchangeCodeForToken(code);

    // Save or update config in database
    const userId = 'default-user'; // TODO: Use actual user ID from session
    let config = await OutlookConfig.findOne({ userId });

    if (config) {
      // Update existing
      config.accessToken = tokenData.accessToken;
      config.refreshToken = tokenData.refreshToken;
      config.tokenExpiry = tokenData.expiresOn;
      config.emailAddress = tokenData.emailAddress;
      config.connectionStatus = 'connected';
      config.lastError = undefined;
    } else {
      // Create new
      config = new OutlookConfig({
        userId,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiry: tokenData.expiresOn,
        emailAddress: tokenData.emailAddress,
        connectionStatus: 'connected',
        syncEnabled: true,
        syncInterval: 30,
        emailFolders: ['Inbox'],
        filterSenders: [],
        filterSubjectKeywords: ['job', 'position', 'opening', 'resume', 'cv']
      });
    }

    await config.save();

    console.log(`✅ Outlook connected successfully: ${tokenData.emailAddress}`);

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/recruiter-dashboard?outlook_connected=true&email=${encodeURIComponent(tokenData.emailAddress)}`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/recruiter-dashboard?outlook_error=auth_failed`);
  }
});

/**
 * GET /api/outlook/status
 * Get current Outlook connection status
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'default-user'; // TODO: Use actual user ID from session

    // Check if demo mode
    const demoStatus = await outlookDemoService.getDemoStatus(userId);
    if (demoStatus.isDemo) {
      res.json({
        success: true,
        connected: true,
        isDemo: true,
        status: 'connected',
        emailAddress: demoStatus.emailAddress,
        lastSyncDate: demoStatus.lastSyncDate,
        syncEnabled: demoStatus.syncEnabled,
        message: 'Demo mode active - no Azure AD credentials required'
      });
      return;
    }

    const config = await OutlookConfig.findOne({ userId });

    if (!config) {
      res.json({
        success: true,
        connected: false,
        isDemo: false,
        isDemoAvailable: isDemoModeEnabled,
        message: 'Outlook not connected'
      });
      return;
    }

    res.json({
      success: true,
      connected: config.connectionStatus === 'connected',
      isDemo: false,
      status: config.connectionStatus,
      emailAddress: config.emailAddress,
      lastSyncDate: config.lastSyncDate,
      syncEnabled: config.syncEnabled,
      syncInterval: config.syncInterval,
      lastError: config.lastError
    });
  } catch (error: any) {
    console.error('Error getting Outlook status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outlook/sync
 * Manually trigger email sync (supports demo mode)
 */
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'default-user'; // TODO: Use actual user ID from session

    console.log('🔄 Manual sync triggered by user');

    // Check if demo mode
    const isDemo = await outlookDemoService.isDemoMode(userId);

    let result;
    if (isDemo) {
      console.log('🎭 Running in DEMO mode');
      result = await outlookDemoService.syncDemoEmails(userId);
    } else {
      result = await outlookService.syncEmails(userId);
    }

    res.json({
      success: true,
      message: isDemo ? 'Demo email sync completed' : 'Email sync completed',
      isDemo,
      jobsProcessed: result.jobsProcessed,
      resumesProcessed: result.resumesProcessed,
      errors: result.errors.length > 0 ? result.errors : undefined
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: error.message || 'Failed to sync emails'
    });
  }
});

/**
 * POST /api/outlook/disconnect
 * Disconnect Outlook account
 */
router.post('/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'default-user'; // TODO: Use actual user ID from session

    await outlookService.disconnect(userId);

    res.json({
      success: true,
      message: 'Outlook account disconnected successfully'
    });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/outlook/settings
 * Update sync settings
 */
router.put('/settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'default-user'; // TODO: Use actual user ID from session
    const { syncEnabled, syncInterval, emailFolders, filterSubjectKeywords } = req.body;

    const config = await OutlookConfig.findOne({ userId });

    if (!config) {
      res.status(404).json({ error: 'Outlook not connected' });
      return;
    }

    // Update settings
    if (syncEnabled !== undefined) config.syncEnabled = syncEnabled;
    if (syncInterval !== undefined) config.syncInterval = syncInterval;
    if (emailFolders !== undefined) config.emailFolders = emailFolders;
    if (filterSubjectKeywords !== undefined) config.filterSubjectKeywords = filterSubjectKeywords;

    await config.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      config: {
        syncEnabled: config.syncEnabled,
        syncInterval: config.syncInterval,
        emailFolders: config.emailFolders,
        filterSubjectKeywords: config.filterSubjectKeywords
      }
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outlook/connect-demo
 * Connect in demo mode without Azure AD
 */
router.post('/connect-demo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailAddress } = req.body;
    const demoEmail = emailAddress || 'demo@outlook.com';

    console.log(`🎭 Connecting Outlook in DEMO mode: ${demoEmail}`);

    const result = await outlookDemoService.connectDemo(demoEmail);

    res.json({
      success: true,
      isDemo: true,
      emailAddress: result.emailAddress,
      message: result.message + ' (Demo Mode - No Azure AD required)'
    });
  } catch (error: any) {
    console.error('Demo connect error:', error);
    res.status(500).json({
      error: error.message || 'Failed to connect in demo mode'
    });
  }
});

/**
 * GET /api/outlook/test
 * Test Outlook connection
 */
router.get('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'default-user'; // TODO: Use actual user ID from session
    const config = await OutlookConfig.findOne({ userId });

    if (!config) {
      res.status(404).json({ error: 'Outlook not connected' });
      return;
    }

    const accessToken = await outlookService.getValidAccessToken(config);
    const testResult = await outlookService.testConnection(accessToken);

    if (testResult.success) {
      config.connectionStatus = 'connected';
      config.lastError = undefined;
      await config.save();
    } else {
      config.connectionStatus = 'error';
      config.lastError = testResult.error;
      await config.save();
    }

    res.json(testResult);
  } catch (error: any) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
