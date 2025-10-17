import express, { Request, Response } from 'express';
import matchingService from '../services/matchingService';

const router = express.Router();

// Test route to verify matching routes are loaded
router.get('/test', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Matching routes are working!' });
});

/**
 * GET /api/matching/job/:jobId/candidates
 * Get matching candidates for a specific job
 */
router.get('/job/:jobId/candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { limit = '10', minScore = '40' } = req.query;

    console.log(`🔍 Finding matching candidates for job: ${jobId}`);

    const matches = await matchingService.findMatchingCandidates(jobId, {
      limit: parseInt(limit as string),
      minScore: parseInt(minScore as string)
    });

    console.log(`✅ Found ${matches.length} matching candidates`);

    res.json({
      success: true,
      jobId,
      totalMatches: matches.length,
      matches
    });
  } catch (error: any) {
    console.error('❌ Error finding matches:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/calculate
 * Calculate match score for a specific job-candidate pair
 */
router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, candidateId } = req.body;

    if (!jobId || !candidateId) {
      res.status(400).json({
        success: false,
        error: 'jobId and candidateId are required'
      });
      return;
    }

    // Import models dynamically to avoid circular dependencies
    const UnifiedJob = require('../models/unifiedJob').default;
    const RecruiterResume = require('../models/recruiterResume').default;

    const job = await UnifiedJob.findById(jobId);
    const candidate = await RecruiterResume.findById(candidateId);

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    if (!candidate) {
      res.status(404).json({ success: false, error: 'Candidate not found' });
      return;
    }

    const matchScore = matchingService.calculateMatchScore(job, candidate);

    res.json({
      success: true,
      matchScore
    });
  } catch (error: any) {
    console.error('Error calculating match:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
