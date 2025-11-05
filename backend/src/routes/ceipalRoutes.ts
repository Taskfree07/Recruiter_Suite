import express, { Request, Response } from 'express';
import ceipalService from '../services/ceipalService';
import UnifiedJob from '../models/unifiedJob';

const router = express.Router();

/**
 * GET /api/ceipal/config
 * Get Ceipal configuration
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || 'default-user';
    const config = await ceipalService.getOrCreateConfig(userId);

    // Check if Ceipal is properly configured
    const isConfigured = !config.mockMode &&
                         config.apiKey &&
                         config.apiKey !== 'MOCK_API_KEY' &&
                         config.username &&
                         config.password &&
                         config.resumeApiUrl;

    res.json({
      success: true,
      config: {
        ...config.toObject(),
        apiKey: config.mockMode ? config.apiKey : '********', // Hide real API key
        isConfigured: isConfigured
      }
    });

  } catch (error: any) {
    console.error('Get config error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ceipal/config
 * Update Ceipal configuration
 */
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId = 'default-user', ...updates } = req.body;

    const config = await ceipalService.updateConfig(userId, updates);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config
    });

  } catch (error: any) {
    console.error('Update config error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ceipal/test-connection
 * Test connection to Ceipal API
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId = 'default-user' } = req.body;

    const result = await ceipalService.testConnection(userId);

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
 * POST /api/ceipal/sync-jobs
 * Sync jobs from Ceipal
 */
router.post('/sync-jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId = 'default-user' } = req.body;

    console.log(`🔄 Starting Ceipal job sync for user: ${userId}`);

    const result = await ceipalService.syncJobs(userId);

    res.json(result);

  } catch (error: any) {
    console.error('Sync jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ceipal/jobs
 * Get all jobs synced from Ceipal with advanced filtering
 */
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId = 'default-user',
      status,
      experienceLevel,
      locationType,
      skill,
      position_title,
      job_status,
      assigned_recruiter,
      industry,
      job_category,
      job_type,
      limit = '50',
      offset = '0'
    } = req.query;

    const query: any = {
      'sources.type': 'ceipal',
      userId: userId // Filter by user
    };

    // Basic filters (existing)
    if (status) {
      query.status = status;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (locationType) {
      query.locationType = locationType;
    }

    if (skill) {
      query.requiredSkills = { $in: [skill] };
    }

    // Advanced filters (from screenshot)
    if (position_title) {
      query.title = { $regex: position_title, $options: 'i' };
    }

    if (job_status) {
      query.status = job_status;
    }

    if (assigned_recruiter) {
      query.assignedRecruiter = assigned_recruiter;
    }

    if (industry) {
      query.industry = industry;
    }

    if (job_category) {
      query.department = job_category;
    }

    if (job_type) {
      query.jobType = job_type;
    }

    const jobs = await UnifiedJob.find(query)
      .sort({ postedDate: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await UnifiedJob.countDocuments(query);

    res.json({
      success: true,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      jobs
    });

  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ceipal/jobs/:id
 * Get specific job details
 */
router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await UnifiedJob.findById(id);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Increment view count
    job.viewsCount += 1;
    await job.save();

    res.json({
      success: true,
      job
    });

  } catch (error: any) {
    console.error('Get job error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ceipal/candidates
 * Fetch candidates from Ceipal API with filtering
 */
router.get('/candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId = 'default-user' } = req.query;

    // Extract filters from query parameters (based on screenshot rules)
    const filters: any = {};

    if (req.query.skills) {
      filters.skills = (req.query.skills as string).split(',');
    }
    if (req.query.country) {
      filters.country = req.query.country;
    }
    if (req.query.postal_code) {
      filters.postal_code = req.query.postal_code;
    }
    if (req.query.work_authorization) {
      filters.work_authorization = req.query.work_authorization;
    }
    if (req.query.applicant_status) {
      filters.applicant_status = req.query.applicant_status;
    }
    if (req.query.modifiedAfter) {
      filters.modifiedAfter = new Date(req.query.modifiedAfter as string);
    }
    if (req.query.modifiedBefore) {
      filters.modifiedBefore = new Date(req.query.modifiedBefore as string);
    }
    if (req.query.experience) {
      filters.experience = parseInt(req.query.experience as string);
    }

    const candidates = await ceipalService.fetchCandidates(userId as string, filters);

    res.json({
      success: true,
      total: candidates.length,
      candidates
    });

  } catch (error: any) {
    console.error('Fetch candidates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ceipal/sync-resumes
 * Sync resumes/submissions from Ceipal
 */
router.post('/sync-resumes', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId || 'default-user';
    console.log('🔄 Starting Ceipal resume sync for user:', userId);

    const result = await ceipalService.syncResumes(userId);

    res.json(result);

  } catch (error: any) {
    console.error('❌ Sync resumes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ceipal/stats
 * Get Ceipal sync statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalJobs = await UnifiedJob.countDocuments({ 'sources.type': 'ceipal' });
    const openJobs = await UnifiedJob.countDocuments({ 'sources.type': 'ceipal', status: 'open' });
    const filledJobs = await UnifiedJob.countDocuments({ 'sources.type': 'ceipal', status: 'filled' });

    const jobsByLevel = await UnifiedJob.aggregate([
      { $match: { 'sources.type': 'ceipal' } },
      {
        $group: {
          _id: '$experienceLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const topSkills = await UnifiedJob.aggregate([
      { $match: { 'sources.type': 'ceipal', status: 'open' } },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalJobs,
        openJobs,
        filledJobs,
        jobsByLevel,
        topSkills
      }
    });

  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
