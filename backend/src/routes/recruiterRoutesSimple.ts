import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import RecruiterResume from '../models/recruiterResume';
import UnifiedJob from '../models/unifiedJob';
import emailService from '../services/emailService';
import aiService from '../services/aiService';

const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/candidate-resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

/**
 * POST /api/recruiter/upload-resumes
 * Upload resumes from different sources (email, portal, manual)
 */
router.post('/upload-resumes', upload.array('resumes', 20), async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as unknown as Express.Multer.File[];
    const source = req.body.source || 'manual'; // email, portal, manual

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    console.log(`📤 Processing ${files.length} resume(s) from ${source}`);

    const processedResumes = [];
    const errors = [];

    for (const file of files) {
      try {
        // Process each resume using emailService
        const resume = await emailService.processResumeFile(file.path, file.originalname, {
          type: source,
          receivedDate: new Date(),
        });

        processedResumes.push(resume);
        console.log(`✅ Processed: ${file.originalname}`);
      } catch (error: any) {
        console.error(`❌ Error processing ${file.originalname}:`, error.message);
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Uploaded ${processedResumes.length} resume(s)`,
      uploaded: processedResumes.length,
      failed: errors.length,
      resumes: processedResumes,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/recruiter/seed-demo-candidates
 * Seed database with demo candidates from various sources
 */
router.post('/seed-demo-candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const seedDemoCandidates = require('../scripts/seedDemoCandidates').default;
    const result = await seedDemoCandidates();

    res.json({
      success: true,
      message: `Successfully seeded ${result.length} demo candidates`,
      count: result.length,
      resumes: result
    });

  } catch (error: any) {
    console.error('Seed demo candidates error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/recruiter/email/simulate-fetch
 * Simulate fetching resumes from email (for demo)
 */
router.post('/email/simulate-fetch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      res.status(400).json({ error: 'folderPath is required' });
      return;
    }

    const resumes = await emailService.simulateEmailFetchFromFolder(folderPath);

    res.json({
      success: true,
      message: `Fetched and processed ${resumes.length} resumes from email simulation`,
      resumes: resumes
    });

  } catch (error: any) {
    console.error('Email simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/recruiter/email/parse-job
 * Parse job description from email content using AI (Hugging Face)
 */
router.post('/email/parse-job', async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailContent } = req.body;

    if (!emailContent || emailContent.trim().length === 0) {
      res.status(400).json({ error: 'emailContent is required' });
      return;
    }

    console.log('📧 Parsing job description from email using Hugging Face AI...');

    // Use AI service to parse job description
    const jobDescription = await aiService.parseJobDescriptionFromEmail(emailContent);

    if (!jobDescription) {
      res.status(400).json({
        error: 'Could not extract job description from email. Please ensure the email contains valid job information.'
      });
      return;
    }

    console.log('✅ Successfully extracted job description:', jobDescription.title);

    // TODO: Save to unified_jobs collection when implemented
    // For now, just return the parsed data

    res.json({
      success: true,
      message: 'Job description extracted successfully from email',
      job: jobDescription,
      parsedBy: 'Hugging Face AI (Mistral-7B)'
    });

  } catch (error: any) {
    console.error('Error parsing job from email:', error);
    res.status(500).json({
      error: error.message || 'Failed to parse job description from email'
    });
  }
});

/**
 * GET /api/recruiter/resumes
 * Get all resumes with optional filters including date ranges
 */
router.get('/resumes', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      skill,
      category,
      experienceLevel,
      status,
      minScore,
      search,
      dateFilter, // 'today', 'week', 'month', 'all'
      startDate,  // Custom date range start
      endDate,    // Custom date range end
      sortBy = 'date', // 'date', 'score', 'name'
      sortOrder = 'desc', // 'asc', 'desc'
      limit = '50',
      offset = '0'
    } = req.query;

    const query: any = {};

    if (skill) {
      query['categories.specificSkills'] = skill;
    }

    if (category) {
      query['categories.primaryCategory'] = category;
    }

    if (experienceLevel) {
      query['categories.experienceLevel'] = experienceLevel;
    }

    if (status) {
      query.status = status;
    }

    if (minScore) {
      query['scores.overall'] = { $gte: parseInt(minScore as string) };
    }

    // Date filtering
    if (dateFilter) {
      const now = new Date();
      let filterDate: Date;

      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.setHours(0, 0, 0, 0));
          query['source.receivedDate'] = { $gte: filterDate };
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query['source.receivedDate'] = { $gte: filterDate };
          break;
        case 'month':
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query['source.receivedDate'] = { $gte: filterDate };
          break;
        case 'all':
        default:
          // No date filter
          break;
      }
    }

    // Custom date range
    if (startDate || endDate) {
      query['source.receivedDate'] = {};
      if (startDate) {
        query['source.receivedDate'].$gte = new Date(startDate as string);
      }
      if (endDate) {
        query['source.receivedDate'].$lte = new Date(endDate as string);
      }
    }

    if (search) {
      query.$or = [
        { 'personalInfo.name': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'categories.specificSkills': { $regex: search, $options: 'i' } }
      ];
    }

    // Dynamic sorting
    let sortCriteria: any = { createdAt: -1 }; // Default: newest first

    if (sortBy === 'score') {
      sortCriteria = { 'scores.overall': sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'name') {
      sortCriteria = { 'personalInfo.name': sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'date') {
      sortCriteria = { 'source.receivedDate': sortOrder === 'asc' ? 1 : -1 };
    }

    const resumes = await RecruiterResume.find(query)
      .sort(sortCriteria)
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await RecruiterResume.countDocuments(query);

    res.json({
      success: true,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      filters: {
        skill,
        category,
        experienceLevel,
        dateFilter,
        sortBy,
        sortOrder
      },
      resumes
    });

  } catch (error: any) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruiter/skills/categories
 * Get resume count by skill categories
 */
router.get('/skills/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await RecruiterResume.aggregate([
      { $match: { processed: true } },
      {
        $group: {
          _id: '$categories.primaryCategory',
          count: { $sum: 1 },
          avgScore: { $avg: '$scores.overall' },
          latestResume: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      categories
    });

  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruiter/skills/:skill/resumes
 * Get resumes by specific skill
 */
router.get('/skills/:skill/resumes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { skill } = req.params;
    const { limit = '50', experienceLevel } = req.query;

    const query: any = {
      'categories.specificSkills': { $regex: skill, $options: 'i' },
      processed: true
    };

    if (experienceLevel) {
      query['categories.experienceLevel'] = experienceLevel;
    }

    const resumes = await RecruiterResume.find(query)
      .sort({ 'scores.overall': -1, createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      skill,
      count: resumes.length,
      resumes
    });

  } catch (error: any) {
    console.error('Get skill resumes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruiter/resumes/grouped-by-skill
 * Get resumes grouped by primary skills with ordering
 */
router.get('/resumes/grouped-by-skill', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFilter, sortBy = 'count' } = req.query;

    // Build date filter
    let dateQuery: any = {};
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let filterDate: Date;

      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.setHours(0, 0, 0, 0));
          dateQuery = { 'source.receivedDate': { $gte: filterDate } };
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateQuery = { 'source.receivedDate': { $gte: filterDate } };
          break;
        case 'month':
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateQuery = { 'source.receivedDate': { $gte: filterDate } };
          break;
      }
    }

    // Aggregate by primary category
    const categoryGroups = await RecruiterResume.aggregate([
      { $match: { processed: true, ...dateQuery } },
      {
        $group: {
          _id: '$categories.primaryCategory',
          count: { $sum: 1 },
          avgScore: { $avg: '$scores.overall' },
          topScore: { $max: '$scores.overall' },
          latestDate: { $max: '$source.receivedDate' },
          resumes: {
            $push: {
              id: '$_id',
              name: '$personalInfo.name',
              email: '$personalInfo.email',
              skills: '$categories.specificSkills',
              score: '$scores.overall',
              experience: '$professionalDetails.totalExperience',
              receivedDate: '$source.receivedDate'
            }
          }
        }
      },
      { $sort: sortBy === 'score' ? { avgScore: -1 } : { count: -1 } }
    ]);

    // Get detailed skill breakdown within each category
    const skillBreakdown: any = {};

    for (const category of categoryGroups) {
      // Get top skills in this category
      const skillCounts: any = {};

      category.resumes.forEach((resume: any) => {
        resume.skills.forEach((skill: string) => {
          if (!skillCounts[skill]) {
            skillCounts[skill] = {
              skill,
              count: 0,
              resumes: []
            };
          }
          skillCounts[skill].count++;
          skillCounts[skill].resumes.push(resume.id);
        });
      });

      // Sort resumes by score within category
      category.resumes.sort((a: any, b: any) => b.score - a.score);

      skillBreakdown[category._id] = Object.values(skillCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10); // Top 10 skills per category
    }

    res.json({
      success: true,
      dateFilter: dateFilter || 'all',
      sortBy,
      totalCategories: categoryGroups.length,
      categories: categoryGroups,
      skillBreakdown
    });

  } catch (error: any) {
    console.error('Get grouped resumes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruiter/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalResumes = await RecruiterResume.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const receivedToday = await RecruiterResume.countDocuments({
      createdAt: { $gte: today }
    });

    const receivedThisWeek = await RecruiterResume.countDocuments({
      createdAt: { $gte: thisWeek }
    });

    const pendingReview = await RecruiterResume.countDocuments({
      status: 'pending_review'
    });

    const topRated = await RecruiterResume.countDocuments({
      'scores.overall': { $gte: 80 }
    });

    const topSkills = await RecruiterResume.aggregate([
      { $match: { createdAt: { $gte: thisWeek } } },
      { $unwind: '$categories.specificSkills' },
      {
        $group: {
          _id: '$categories.specificSkills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalResumes,
        receivedToday,
        receivedThisWeek,
        pendingReview,
        topRated,
        topSkills
      }
    });

  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/recruiter/resumes/clear-all
 * Clear all recruiter resumes from database
 */
router.delete('/resumes/clear-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await RecruiterResume.deleteMany({});

    console.log(`🗑️ Cleared ${result.deletedCount} resumes from database`);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} resume(s)`,
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error('Clear all resumes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recruiter/jobs
 * Get all unified jobs
 */
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = '50', offset = '0', sortBy = 'postedDate' } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const jobs = await UnifiedJob.find(query)
      .sort({ [sortBy as string]: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await UnifiedJob.countDocuments(query);

    res.json({
      success: true,
      total,
      jobs
    });
  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/recruiter/jobs/clear-all
 * Clear all unified jobs from database
 */
router.delete('/jobs/clear-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await UnifiedJob.deleteMany({});

    console.log(`🗑️ Cleared ${result.deletedCount} jobs from database`);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} job(s)`,
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error('Clear all jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
