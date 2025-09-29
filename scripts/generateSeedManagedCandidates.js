const fs = require('fs');
const path = require('path');

const resumesDir = path.resolve(__dirname, '../backend/uploads/resumes');
const outFile = path.resolve(__dirname, '../frontend/src/data/seedManagedCandidates.json');

// Default candidate list
const candidates = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Mike Johnson' },
  { id: '4', name: 'Sarah Wilson' },
  { id: '5', name: 'David Brown' }
];

function main() {
  if (!fs.existsSync(resumesDir)) {
    console.error('Resumes directory not found:', resumesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(resumesDir).filter(f => f.toLowerCase().startsWith('resume_') || f.toLowerCase().endsWith('.pdf'));

  const now = new Date().toISOString();

  // Round-robin assign files to candidates
  const managed = candidates.map(c => ({ ...c, resumes: [] }));

  files.forEach((file, idx) => {
    const resume = {
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2,8)}`,
      fileName: file,
      file: null,
      uploadedAt: now,
      candidateId: managed[idx % managed.length].id
    };
    managed[idx % managed.length].resumes.push(resume);
  });

  // Ensure output dir
  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outFile, JSON.stringify(managed, null, 2));
  console.log('Wrote seed file to', outFile);
}

main();
