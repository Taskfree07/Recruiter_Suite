import express, { Request, Response } from 'express';
import outlookService from '../services/outlookService';

const router = express.Router();

// Store user tokens temporarily (in production, use database or secure session)
const userTokens = new Map<string, { accessToken: string; expiresOn: Date }>();

/**
 * GET /api/outlook/auth/login
 * Get Outlook OAuth login URL
 */
router.get('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string || 'default-user';

    if (!outlookService.isConfigured()) {
      res.status(500).json({
        error: 'Outlook service not configured. Please check environment variables.',
        configured: false
      });
      return;
    }

    // Get OAuth URL
    const authUrl = await outlookService.getAuthUrl(userId);

    console.log(`🔗 Generated Outlook auth URL for user: ${userId}`);

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authenticate with Outlook'
    });

  } catch (error: any) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outlook/auth/callback
 * OAuth callback endpoint - Microsoft redirects here after user login
 */
router.get('/auth/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string; // userId
    const error = req.query.error as string;

    // Handle authorization errors
    if (error) {
      console.error('❌ OAuth error:', error);
      res.redirect(`http://localhost:3000/resume-dashboard?outlook_error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const userId = state || 'default-user';

    // Exchange code for access token
    const tokenResponse = await outlookService.acquireTokenByCode(code, userId);

    // Store token (in production, save to database with encryption)
    userTokens.set(userId, {
      accessToken: tokenResponse.accessToken,
      expiresOn: tokenResponse.expiresOn
    });

    console.log(`✅ User authenticated successfully: ${userId}`);

    // Redirect back to frontend with success
    res.redirect(`http://localhost:3000/resume-dashboard?outlook_connected=true`);

  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    res.redirect(`http://localhost:3000/resume-dashboard?outlook_error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /api/outlook/sync
 * Sync resumes from Outlook emails
 */
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId = 'default-user', syncPeriod = 'lastMonth' } = req.body;

    // Check if user is authenticated
    const tokenData = userTokens.get(userId);

    if (!tokenData) {
      res.status(401).json({
        error: 'Not authenticated. Please login with Outlook first.',
        authenticated: false
      });
      return;
    }

    // Check if token is expired
    if (new Date() >= tokenData.expiresOn) {
      userTokens.delete(userId);
      res.status(401).json({
        error: 'Token expired. Please login again.',
        authenticated: false
      });
      return;
    }

    console.log(`🔄 Starting Outlook sync for user ${userId} - Period: ${syncPeriod}`);

    // Get user email from token (you can store this during auth)
    const userEmail = userId; // In production, fetch from Microsoft Graph /me endpoint

    // Sync resumes
    const result = await outlookService.syncResumes(tokenData.accessToken, {
      syncPeriod: syncPeriod as 'lastMonth' | 'all',
      userEmail
    });

    res.json({
      success: true,
      message: `Successfully synced ${result.resumesProcessed} resume(s) from Outlook`,
      resumesProcessed: result.resumesProcessed,
      errors: result.errors,
      userEmail: result.userEmail
    });

  } catch (error: any) {
    console.error('❌ Outlook sync error:', error);

    // Handle specific Graph API errors
    if (error.statusCode === 401) {
      res.status(401).json({
        error: 'Authentication failed. Please login again.',
        authenticated: false
      });
      return;
    }

    res.status(500).json({
      error: error.message || 'Failed to sync resumes from Outlook'
    });
  }
});

/**
 * GET /api/outlook/status
 * Check Outlook connection and sync status
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string || 'default-user';

    const tokenData = userTokens.get(userId);
    const isAuthenticated = tokenData && new Date() < tokenData.expiresOn;

    // Get sync stats
    const stats = await outlookService.getSyncStats();

    res.json({
      success: true,
      configured: outlookService.isConfigured(),
      authenticated: isAuthenticated,
      tokenExpiry: tokenData?.expiresOn || null,
      stats: {
        totalResumes: stats.total,
        lastMonthResumes: stats.lastMonth,
        lastSync: stats.lastSync,
        lastSyncBy: stats.lastSyncBy
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking Outlook status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/outlook/disconnect
 * Disconnect Outlook and clear tokens
 */
router.delete('/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId || 'default-user';

    // Remove stored token
    userTokens.delete(userId);

    console.log(`🔌 User disconnected from Outlook: ${userId}`);

    res.json({
      success: true,
      message: 'Successfully disconnected from Outlook'
    });

  } catch (error: any) {
    console.error('❌ Error disconnecting Outlook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/outlook/resumes/clear
 * Clear all Outlook-synced resumes
 */
router.delete('/resumes/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedCount = await outlookService.clearOutlookResumes();

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} Outlook resume(s)`,
      deletedCount
    });

  } catch (error: any) {
    console.error('❌ Error clearing Outlook resumes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
