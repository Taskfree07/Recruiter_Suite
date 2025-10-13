import express from 'express';
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import Candidate from '../models/candidate';
import Job from '../models/job';
import parserService from '../services/parserService';
import scoringService from '../services/scoringService';

const router = express.Router();

// Upload and parse resumes
router.post('/upload/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Log helpful diagnostics
    console.log('Resume upload request received', {
      jobId,
      bodyKeys: Object.keys((req as any).body || {}),
      fileKeys: req.files ? Object.keys(req.files) : [],
    });

    // Collect files from common field names or fallback to all file fields
    const fileContainer: any = (req as any).files || {};
    const candidateKeys = ['resumes', 'resume', 'files', 'file'];
    let incoming: any[] = [];
    candidateKeys.forEach((k) => {
      if (fileContainer[k]) incoming.push(fileContainer[k]);
    });
    if (incoming.length === 0 && Object.keys(fileContainer).length > 0) {
      incoming = Object.values(fileContainer);
    }

    if (!incoming || incoming.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files: UploadedFile[] = incoming.flatMap((v: any) => Array.isArray(v) ? v : [v]);

    // Validate allowed file types
    const allowedExt = new Set(['.pdf', '.docx', '.txt']);
    const invalid = files.filter((f) => !allowedExt.has(path.extname((f as UploadedFile).name).toLowerCase()));
    if (invalid.length > 0) {
      return res.status(400).json({ message: `Unsupported file(s): ${invalid.map((f: any) => f.name).join(', ')}` });
    }

    const results = [];
    const errors: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      try {
        const resumeFile = file as UploadedFile;
        const fileName = `resume_${Date.now()}_${resumeFile.name}`;
        const uploadPath = path.join(process.cwd(), 'uploads', 'resumes', fileName);

        // Save file
        await resumeFile.mv(uploadPath);

        // Extract and parse
        const text = await parserService.extractText(uploadPath);
        const parsedResume = parserService.parseResumeText(text);

        // Calculate score
        const scoringResult = scoringService.calculateScore(parsedResume, job);

        // Save candidate
        const candidate = new Candidate({
          jobId,
          ...parsedResume,
          score: scoringResult.score,
          improvements: scoringResult.improvements,
          resumePath: uploadPath,
          fileName: resumeFile.name
        });

        await candidate.save();
        results.push(candidate);
      } catch (err: any) {
        console.error('Error processing resume file:', err?.message || err);
        errors.push({ fileName: (file as UploadedFile).name, error: err?.message || 'Unknown error' });
      }
    }

    res.json({
      message: `${results.length} resume(s) processed successfully` + (errors.length ? `, ${errors.length} failed` : ''),
      candidates: results,
      errors,
    });
  } catch (error: any) {
    console.error('Error uploading resumes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get candidates for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const candidates = await Candidate.find({ jobId: req.params.jobId })
      .sort({ 'score.overall': -1 });
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update candidate status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;