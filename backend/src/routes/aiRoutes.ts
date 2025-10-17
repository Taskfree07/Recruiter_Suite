import express from 'express';
import aiService from '../services/aiService';

const router = express.Router();

/**
 * Test AI API connection
 * GET /api/ai/test
 */
router.get('/test', async (req, res) => {
  try {
    const result = await aiService.testConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Parse job description from email text
 * POST /api/ai/parse-job
 * Body: { emailContent: string }
 */
router.post('/parse-job', async (req, res) => {
  try {
    const { emailContent } = req.body;

    if (!emailContent) {
      return res.status(400).json({ error: 'emailContent is required' });
    }

    const jobData = await aiService.parseJobDescriptionFromEmail(emailContent);

    if (!jobData) {
      return res.status(500).json({ error: 'Failed to parse job description' });
    }

    res.json({ success: true, jobData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Classify email type
 * POST /api/ai/classify-email
 * Body: { emailContent: string }
 */
router.post('/classify-email', async (req, res) => {
  try {
    const { emailContent } = req.body;

    if (!emailContent) {
      return res.status(400).json({ error: 'emailContent is required' });
    }

    const classification = await aiService.classifyEmail(emailContent);

    if (!classification) {
      return res.status(500).json({ error: 'Failed to classify email' });
    }

    res.json({ success: true, classification });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate match explanation
 * POST /api/ai/match-explanation
 * Body: { candidateData: object, jobData: object, matchScore: number }
 */
router.post('/match-explanation', async (req, res) => {
  try {
    const { candidateData, jobData, matchScore } = req.body;

    if (!candidateData || !jobData || matchScore === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const explanation = await aiService.generateMatchExplanation(
      candidateData,
      jobData,
      matchScore
    );

    if (!explanation) {
      return res.status(500).json({ error: 'Failed to generate explanation' });
    }

    res.json({ success: true, explanation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
