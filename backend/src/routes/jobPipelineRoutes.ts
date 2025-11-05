import express, { Request, Response } from 'express';
import UnifiedJob from '../models/unifiedJob';
import matchingService from '../services/matchingService';
import RecruiterResume from '../models/recruiterResume';

const router = express.Router();

/**
 * GET /api/job-pipeline/stats/overview
 * Get overview statistics for the job pipeline
 * IMPORTANT: This must come BEFORE the /:id route
 */
router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalJobs = await UnifiedJob.countDocuments({ archived: { $ne: true } });
    const openJobs = await UnifiedJob.countDocuments({ status: 'open', archived: { $ne: true } });
    const filledJobs = await UnifiedJob.countDocuments({ status: 'filled', archived: { $ne: true } });

    // Jobs by source
    const jobsBySource = await UnifiedJob.aggregate([
      { $match: { archived: { $ne: true } } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent jobs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentJobs = await UnifiedJob.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      archived: { $ne: true }
    });

    res.json({
      success: true,
      stats: {
        totalJobs,
        openJobs,
        filledJobs,
        recentJobs,
        jobsBySource: jobsBySource.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/job-pipeline
 * Get all jobs from all sources (Outlook, Ceipal, etc.) with optional filtering
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId = 'default-user', // Multi-tenant support
      source,       // Filter by source: 'outlook', 'ceipal', 'manual', etc.
      status,       // Filter by status: 'open', 'closed', 'filled', 'on-hold'
      search,       // Search in title, company, description
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit,
      offset = '0'
    } = req.query;

    // Build filter query
    const filter: any = {
      userId: userId // Filter by user
    };

    if (source && source !== 'all') {
      filter.source = source;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Search functionality
    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    let query = UnifiedJob.find(filter).sort(sort);

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    query = query.skip(parseInt(offset as string));

    const jobs = await query.exec();
    const totalCount = await UnifiedJob.countDocuments(filter);

    // Ensure all jobs have a source field (fallback to 'manual' if missing)
    const jobsWithSource = jobs.map((job: any) => {
      const jobObj = job.toObject();
      if (!jobObj.source && jobObj.sources && jobObj.sources.length > 0) {
        jobObj.source = jobObj.sources[0].type;
      } else if (!jobObj.source) {
        jobObj.source = 'manual';
      }
      return jobObj;
    });

    // Get statistics
    const stats = await UnifiedJob.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const sourceStats = await UnifiedJob.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      jobs: jobsWithSource,
      totalCount,
      stats: {
        byStatus: stats.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>),
        bySource: sourceStats.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>)
      },
      pagination: {
        offset: parseInt(offset as string),
        limit: limit ? parseInt(limit as string) : jobs.length,
        total: totalCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching job pipeline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/job-pipeline/:id
 * Get a specific job with matched candidates
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeMatches = 'true', minScore = '40', matchLimit = '10' } = req.query;

    const job = await UnifiedJob.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    let matches = null;
    if (includeMatches === 'true') {
      matches = await matchingService.findMatchingCandidates(id, {
        limit: parseInt(matchLimit as string),
        minScore: parseInt(minScore as string)
      });
    }

    res.json({
      success: true,
      job,
      matches: matches || []
    });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/job-pipeline/:id/status
 * Update job status (open, closed, filled, on-hold)
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Status is required'
      });
      return;
    }

    const validStatuses = ['open', 'closed', 'filled', 'on-hold', 'interviewing'];
    if (!validStatuses.includes(status.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    const job = await UnifiedJob.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true }
    );

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    res.json({
      success: true,
      job
    });
  } catch (error: any) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/job-pipeline/:id/priority
 * Update job priority (high, medium, low)
 */
router.patch('/:id/priority', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      res.status(400).json({
        success: false,
        error: 'Priority is required'
      });
      return;
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(priority.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
      return;
    }

    const job = await UnifiedJob.findByIdAndUpdate(
      id,
      { priority: priority.toLowerCase() },
      { new: true }
    );

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    res.json({
      success: true,
      job
    });
  } catch (error: any) {
    console.error('Error updating job priority:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/job-pipeline/:id/notes
 * Add a note to a job
 */
router.post('/:id/notes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      res.status(400).json({
        success: false,
        error: 'Note is required'
      });
      return;
    }

    const job = await UnifiedJob.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    // Initialize notes array if it doesn't exist
    if (!job.notes) {
      job.notes = [];
    }

    job.notes.push({
      text: note,
      createdAt: new Date()
    });

    await job.save();

    res.json({
      success: true,
      job
    });
  } catch (error: any) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/job-pipeline/:jobId/submit-candidate/:candidateId
 * Mark a candidate as submitted for a job
 */
router.post('/:jobId/submit-candidate/:candidateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, candidateId } = req.params;
    const { notes } = req.body;

    const job = await UnifiedJob.findById(jobId);
    const candidate = await RecruiterResume.findById(candidateId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    if (!candidate) {
      res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
      return;
    }

    // Initialize submissions array if it doesn't exist
    if (!job.submissions) {
      job.submissions = [];
    }

    // Check if already submitted
    const alreadySubmitted = job.submissions.some(
      (sub: any) => sub.candidateId.toString() === candidateId
    );

    if (alreadySubmitted) {
      res.status(400).json({
        success: false,
        error: 'Candidate already submitted for this job'
      });
      return;
    }

    // Calculate match score
    const matchScore = matchingService.calculateMatchScore(job, candidate);

    // Add submission
    job.submissions.push({
      candidateId: candidate._id as any,
      candidateName: candidate.personalInfo.name,
      submittedAt: new Date(),
      status: 'submitted',
      matchScore: matchScore.overall,
      notes
    });

    await job.save();

    res.json({
      success: true,
      job,
      message: `${candidate.personalInfo.name} submitted successfully`
    });
  } catch (error: any) {
    console.error('Error submitting candidate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/job-pipeline/:id/archive
 * Archive a job (soft delete)
 */
router.delete('/:id/archive', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await UnifiedJob.findByIdAndUpdate(
      id,
      {
        archived: true,
        archivedAt: new Date()
      },
      { new: true }
    );

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Job archived successfully',
      job
    });
  } catch (error: any) {
    console.error('Error archiving job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/job-pipeline/:id/restore
 * Restore an archived job
 */
router.post('/:id/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await UnifiedJob.findByIdAndUpdate(
      id,
      {
        archived: false,
        archivedAt: null
      },
      { new: true }
    );

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Job restored successfully',
      job
    });
  } catch (error: any) {
    console.error('Error restoring job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
