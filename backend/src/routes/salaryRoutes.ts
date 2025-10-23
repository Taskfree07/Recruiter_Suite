import express, { Request, Response } from 'express';
import salaryService from '../services/salaryService';

const router = express.Router();

/**
 * POST /api/salary/predict
 * Predict salary based on job title, location, and experience
 */
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const { jobTitle, location, experienceYears, skills } = req.body;

    // Validate input
    const validation = salaryService.validateInput({ jobTitle, location, experienceYears, skills });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    console.log(`📊 Salary prediction request: ${jobTitle} in ${location}`);

    // Call salary service
    const prediction = await salaryService.predictSalary({
      jobTitle,
      location,
      experienceYears: experienceYears || 3,
      skills: skills || [],
    });

    res.json({
      success: true,
      prediction,
    });
  } catch (error: any) {
    console.error('Error predicting salary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict salary',
    });
  }
});

/**
 * GET /api/salary/cost-of-living/:location
 * Get cost of living index for a location
 */
router.get('/cost-of-living/:location', (req: Request, res: Response) => {
  try {
    const { location } = req.params;
    const colIndex = salaryService.getCostOfLiving(location);

    res.json({
      success: true,
      location,
      costOfLivingIndex: colIndex,
      nationalAverage: 1.0,
    });
  } catch (error: any) {
    console.error('Error getting cost of living:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cost of living data',
    });
  }
});

/**
 * GET /api/salary/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  console.log('Health endpoint called');
  res.json({
    success: true,
    message: 'Salary prediction service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
