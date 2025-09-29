import express from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import Candidate from '../models/candidate';
import Job from '../models/job';
import path from 'path';
import parserService from '../services/parserService';
import scoringService from '../services/scoringService';

const router = express.Router();

router.post('/check-candidate-fit', async (req, res) => {
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

    // Group resumes by candidate
    const candidateResumes = new Map<string, UploadedFile[]>();
    resumeFiles.forEach((file: UploadedFile) => {
      const [candidateId] = path.parse(file.name).name.split('_');
      if (!candidateResumes.has(candidateId)) {
        candidateResumes.set(candidateId, []);
      }
      candidateResumes.get(candidateId)!.push(file);
    });

    // Process each candidate's resumes in parallel
    const results = await Promise.all(
      Array.from(candidateResumes.entries()).map(async ([candidateId, files]) => {
        try {
          const candidateScores = await Promise.all(
            files.map(async (file) => {
              // Save file temporarily
              const tempPath = path.join('uploads/temp', file.name);
              await file.mv(tempPath);

              // Parse and score the resume
              const parsedData = await parserService.parseResume(tempPath);
              const scoringResult = scoringService.calculateScore(parsedData, job);

              // Clean up temp file
              fs.unlinkSync(tempPath);

              return scoringResult.score;
            })
          );

          // Calculate aggregate score for the candidate
          const aggregateScore = {
            overall: Math.round(candidateScores.reduce((acc, score) => acc + score.overall, 0) / candidateScores.length),
            skillMatch: Math.round(candidateScores.reduce((acc, score) => acc + score.skillMatch, 0) / candidateScores.length),
            experienceMatch: Math.round(candidateScores.reduce((acc, score) => acc + score.experienceMatch, 0) / candidateScores.length),
            educationMatch: Math.round(candidateScores.reduce((acc, score) => acc + score.educationMatch, 0) / candidateScores.length),
            keywordMatch: Math.round(candidateScores.reduce((acc, score) => acc + score.keywordMatch, 0) / candidateScores.length),
          };

          return {
            candidateId,
            score: aggregateScore,
          };
        } catch (error) {
          console.error(`Error processing candidate ${candidateId}:`, error);
          return {
            candidateId,
            error: 'Failed to process candidate'
          };
        }
      })
    );

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;