import express from 'express';
import fs from 'fs';
import path from 'path';
import { UploadedFile } from 'express-fileupload';
import Candidate from '../models/candidate';

const router = express.Router();

// Upload resumes for a specific candidate
router.post('/upload/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const files = req.files?.resumes;

    if (!files) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Handle both single and multiple files
    const resumeFiles = Array.isArray(files) ? files : [files];
    const uploadedResumes = [];

    // Create candidate-specific directory
    const candidateDir = path.join(__dirname, '../../uploads/resumes', candidateId);
    if (!fs.existsSync(candidateDir)) {
      fs.mkdirSync(candidateDir, { recursive: true });
    }

    // Save each resume
    for (const file of resumeFiles) {
      const uploadedFile = file as UploadedFile;
      const fileName = `${Date.now()}_${uploadedFile.name}`;
      const filePath = path.join(candidateDir, fileName);
      
      await uploadedFile.mv(filePath);
      
      uploadedResumes.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: uploadedFile.name,
        filePath: `uploads/resumes/${candidateId}/${fileName}`,
        uploadedAt: new Date().toISOString()
      });
    }

    res.json({
      message: 'Resumes uploaded successfully',
      resumes: uploadedResumes
    });
  } catch (error: any) {
    console.error('Error uploading resumes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to get random resumes from a directory
const getRandomResumes = (numResumes: number, sourcePath: string) => {
  const files = fs.readdirSync(sourcePath).filter(file => file.endsWith('.pdf'));
  const selectedFiles = [];
  while (selectedFiles.length < numResumes && files.length > 0) {
    const randomIndex = Math.floor(Math.random() * files.length);
    selectedFiles.push(files[randomIndex]);
    files.splice(randomIndex, 1);
  }
  return selectedFiles;
};

// Route to assign random resumes to all candidates
router.post('/assign-resumes', async (req, res) => {
  try {
    // Get all candidates
    const candidates = await Candidate.find();
    const resumes = fs.readdirSync(path.join(__dirname, '../../uploads/resumes'))
                     .filter(file => file.endsWith('.pdf'));

    // Calculate resumes per candidate (distribute evenly)
    const resumesPerCandidate = Math.floor(resumes.length / candidates.length);
    const sourcePath = path.join(__dirname, '../../uploads/resumes');

    // Assign resumes to each candidate
    for (const candidate of candidates) {
      const assignedResumes = getRandomResumes(resumesPerCandidate, sourcePath);
      
      // Move resumes to candidate's directory
      for (const resume of assignedResumes) {
        const source = path.join(sourcePath, resume);
        const destination = path.join(sourcePath, `candidate_${candidate._id}_${resume}`);
        fs.renameSync(source, destination);
      }

      // Update candidate with resume paths
      candidate.resumes = assignedResumes.map(resume => ({
        path: `uploads/resumes/candidate_${candidate._id}_${resume}`,
        fileName: resume
      }));

      await candidate.save();
    }

    res.json({
      message: 'Resumes assigned successfully',
      distribution: {
        totalCandidates: candidates.length,
        totalResumes: resumes.length,
        resumesPerCandidate
      }
    });
  } catch (error: any) {
    console.error('Error assigning resumes:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;