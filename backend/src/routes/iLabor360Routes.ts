import express, { Request, Response } from 'express';
import iLabor360Service from '../services/iLabor360Service';

const router = express.Router();

/**
 * GET /api/ilabor360/config
 * Get iLabor360 configuration
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || 'default-user';
    const config = await iLabor360Service.getOrCreateConfig(userId);

    // Hide password in response
    res.json({
      success: true,
      config: {
        ...config.toObject(),
        password: config.password ? '********' : ''
      }
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ilabor360/config
 * Update iLabor360 configuration
 */
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.body.userId as string) || 'default-user';
    const updates = req.body;

    console.log('📝 Updating iLabor360 config for user:', userId);

    const config = await iLabor360Service.updateConfig(userId, updates);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        ...config.toObject(),
        password: config.password ? '********' : ''
      }
    });
  } catch (error: any) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ilabor360/test-connection
 * Test connection to iLabor360
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.body.userId as string) || 'default-user';

    console.log('🔌 Testing iLabor360 connection for user:', userId);

    const result = await iLabor360Service.testConnection(userId);

    res.json(result);
  } catch (error: any) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ilabor360/sync
 * Manually trigger sync
 */
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.body.userId as string) || 'default-user';

    console.log('🔄 Starting manual iLabor360 sync for user:', userId);

    const result = await iLabor360Service.syncAll(userId, 'manual');

    res.json({
      success: true,
      message: result.message,
      stats: {
        requisitions: {
          found: result.requisitions.added + result.requisitions.updated + result.requisitions.skipped,
          added: result.requisitions.added,
          updated: result.requisitions.updated,
          skipped: result.requisitions.skipped
        },
        durationMs: result.durationMs,
        errors: result.requisitions.errors.length
      }
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ilabor360/stats
 * Get sync statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || 'default-user';

    const stats = await iLabor360Service.getStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ilabor360/sync-logs
 * Get sync logs
 */
router.get('/sync-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || 'default-user';
    const limit = parseInt(req.query.limit as string) || 20;

    const logs = await iLabor360Service.getSyncLogs(userId, limit);

    res.json({
      success: true,
      logs
    });
  } catch (error: any) {
    console.error('Get sync logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
