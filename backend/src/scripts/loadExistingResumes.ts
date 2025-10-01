import fs from 'fs';
import path from 'path';

/**
 * Script to load existing resumes from Resume/ folder into the backend storage
 * and create a seed data file for the frontend
 */

const RESUME_SOURCE_DIR = path.join(__dirname, '../../../Resume');
const RESUME_DEST_DIR = path.join(__dirname, '../../uploads/resumes');
const SEED_OUTPUT_FILE = path.join(__dirname, '../../../frontend/src/data/seedManagedCandidates.json');

// Predefined candidate names
const CANDIDATE_NAMES = [
  'John Doe',
  'Jane Smith',
  'Mike Johnson',
  'Sarah Wilson',
  'David Brown',
  'Emily Davis',
  'James Miller',
  'Lisa Anderson',
  'Robert Taylor',
  'Jennifer Thomas'
];

interface CandidateResume {
  id: string;
  fileName: string;
  filePath: string;
  file: null;
  uploadedAt: string;
}

interface CandidateData {
  id: string;
  name: string;
  resumes: CandidateResume[];
}

async function loadExistingResumes() {
  try {
    console.log('🚀 Starting resume loading process...\n');

    // Check if source directory exists
    if (!fs.existsSync(RESUME_SOURCE_DIR)) {
      console.error(`❌ Source directory not found: ${RESUME_SOURCE_DIR}`);
      return;
    }

    // Get all PDF files from Resume folder
    const resumeFiles = fs.readdirSync(RESUME_SOURCE_DIR)
      .filter(file => file.toLowerCase().endsWith('.pdf'));

    console.log(`📁 Found ${resumeFiles.length} resume files\n`);

    if (resumeFiles.length === 0) {
      console.log('⚠️  No PDF files found in Resume folder');
      return;
    }

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(RESUME_DEST_DIR)) {
      fs.mkdirSync(RESUME_DEST_DIR, { recursive: true });
    }

    // Distribute resumes among candidates
    const resumesPerCandidate = Math.ceil(resumeFiles.length / CANDIDATE_NAMES.length);
    const candidates: CandidateData[] = [];

    let resumeIndex = 0;

    for (let i = 0; i < CANDIDATE_NAMES.length && resumeIndex < resumeFiles.length; i++) {
      const candidateId = (i + 1).toString();
      const candidateName = CANDIDATE_NAMES[i];
      const candidateDir = path.join(RESUME_DEST_DIR, candidateId);

      // Create candidate directory
      if (!fs.existsSync(candidateDir)) {
        fs.mkdirSync(candidateDir, { recursive: true });
      }

      const candidateResumes: CandidateResume[] = [];

      // Assign resumes to this candidate
      const numResumesForCandidate = Math.min(resumesPerCandidate, resumeFiles.length - resumeIndex);

      for (let j = 0; j < numResumesForCandidate; j++) {
        const resumeFile = resumeFiles[resumeIndex];
        const timestamp = Date.now() + j;
        const destFileName = `${timestamp}_${resumeFile}`;
        
        const sourcePath = path.join(RESUME_SOURCE_DIR, resumeFile);
        const destPath = path.join(candidateDir, destFileName);

        // Copy file
        fs.copyFileSync(sourcePath, destPath);

        candidateResumes.push({
          id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: resumeFile,
          filePath: `uploads/resumes/${candidateId}/${destFileName}`,
          file: null,
          uploadedAt: new Date().toISOString()
        });

        resumeIndex++;
      }

      candidates.push({
        id: candidateId,
        name: candidateName,
        resumes: candidateResumes
      });

      console.log(`✅ ${candidateName}: ${candidateResumes.length} resumes loaded`);
    }

    // Create seed data file for frontend
    const seedDataDir = path.dirname(SEED_OUTPUT_FILE);
    if (!fs.existsSync(seedDataDir)) {
      fs.mkdirSync(seedDataDir, { recursive: true });
    }

    fs.writeFileSync(SEED_OUTPUT_FILE, JSON.stringify(candidates, null, 2));

    console.log(`\n✨ Success! Loaded ${resumeFiles.length} resumes for ${candidates.length} candidates`);
    console.log(`📝 Seed data saved to: ${SEED_OUTPUT_FILE}`);
    console.log('\n📋 Summary:');
    candidates.forEach(c => {
      console.log(`   ${c.name}: ${c.resumes.length} resumes`);
    });

  } catch (error) {
    console.error('❌ Error loading resumes:', error);
  }
}

// Run the script
loadExistingResumes();
