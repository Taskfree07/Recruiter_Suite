import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fileUpload from 'express-fileupload';
import path from 'path';

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import routes
import jobRoutes from './routes/jobRoutes';
import candidateRoutes from './routes/candidateRoutes';
import scoringRoutes from './routes/scoringRoutes';
import candidateScoringRoutes from './routes/candidateScoringRoutes';
import candidateResumesRoutes from './routes/candidateResumes';
import recruiterRoutes from './routes/recruiterRoutesSimple';
import ceipalRoutes from './routes/ceipalRoutes';
import aiRoutes from './routes/aiRoutes';
import outlookRoutes from './routes/outlookRoutes';

console.log('About to import matching routes...');
import matchingRoutes from './routes/matchingRoutes';
console.log('Matching routes imported successfully:', typeof matchingRoutes);
const app: Application = express();

// Middleware
// Configure CORS for both development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
];

// Add production frontend URL from environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true,
  createParentPath: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create upload directories if they don't exist
import fs from 'fs';
const uploadDirs = ['./uploads', './uploads/resumes', './uploads/jd', './uploads/temp'];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically - MUST be before other routes
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('Serving static files from:', uploadsPath);
console.log('Directory exists:', fs.existsSync(uploadsPath));

// Health check endpoint for deployment platforms
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.send('Backend is working!');
});

// File serving route - inline
app.get('/api/files/resumes/:candidateId/:filename', (req, res) => {
  const { candidateId, filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', 'resumes', candidateId, filename);

  console.log('Requested file:', filePath);
  console.log('File exists:', fs.existsSync(filePath));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set proper headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// Serve static files - simple express.static
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/candidate-scoring', candidateScoringRoutes);
app.use('/api/candidate-resumes', candidateResumesRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/ceipal', ceipalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/outlook', outlookRoutes);
console.log('Registering matching routes at /api/matching');
app.use('/api/matching', matchingRoutes);
console.log('Matching routes registered successfully');

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});