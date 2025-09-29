import express from 'express';
import { UploadedFile } from 'express-fileupload';
import Candidate from '../models/candidate';
import Job from '../models/job';
import scoringService from '../services/scoringService';
import path from 'path';
import parserService from '../services/parserService';
import fs from 'fs';

const router = express.Router();

// Check fit for multiple resumes against a job
router.post('/check-fit', async (req, res) => {
  try {
    const jobId = req.body.jobId;
    const files = req.files?.resumes;

    // Handle both single file and multiple files
    const resumeFiles = Array.isArray(files) ? files : files ? [files] : [];

    if (resumeFiles.length === 0) {
      return res.status(400).json({ message: 'No resumes provided' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Process each resume in parallel
    const results = await Promise.all(
      resumeFiles.map(async (file: UploadedFile) => {
        try {
          // Save file temporarily
          const tempPath = path.join('uploads/temp', file.name);
          await file.mv(tempPath);

          // Parse the resume
          const parsedData = await parserService.parseResume(tempPath);
          
          // Calculate score
          const scoringResult = scoringService.calculateScore(parsedData, job);

          // Clean up temp file
          fs.unlinkSync(tempPath);

          return {
            resumeId: path.parse(file.name).name,
            score: scoringResult.score,
            improvements: scoringResult.improvements,
            strengths: scoringResult.strengths,
          };
        } catch (error) {
          console.error(`Error processing resume ${file.name}:`, error);
          return {
            resumeId: path.parse(file.name).name,
            error: 'Failed to process resume'
          };
        }
      })
    );

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Recalculate score for a candidate
router.post('/recalculate/:candidateId', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const job = await Job.findById(candidate.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const scoringResult = scoringService.calculateScore(candidate, job);
    
    candidate.score = scoringResult.score;
    candidate.improvements = scoringResult.improvements;
    await candidate.save();

    res.json({
      message: 'Score recalculated successfully',
      score: scoringResult.score,
      improvements: scoringResult.improvements
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get scoring breakdown for a candidate
router.get('/:candidateId', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({
      score: candidate.score,
      improvements: candidate.improvements,
      status: candidate.status
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;