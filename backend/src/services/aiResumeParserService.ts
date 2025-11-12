import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import RecruiterResume from '../models/recruiterResume';

/**
 * AI Resume Parser Integration Service
 * Connects Outlook email processing with Python AI parser
 */

interface AIParseResult {
  success: boolean;
  stage: string;
  confidence: number;
  data: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    skills: string[];
    experience: any[];
    education: any[];
    certifications: string[];
  };
  errors: string[];
}

class AIResumeParserService {
  private pythonPath: string;
  private scriptPath: string;
  private minConfidence: number = 0.85;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(__dirname, '../../ai-matching-service/ai_resume_parser.py');
  }

  /**
   * Process resume attachment using AI parser
   */
  async processResumeAttachment(
    attachmentPath: string,
    filename: string,
    emailData: {
      from: string;
      subject: string;
      receivedDate: Date;
    }
  ): Promise<{ success: boolean; resume?: any; error?: string }> {
    try {
      console.log(`🤖 AI Processing: ${filename}`);

      // Call Python AI parser
      const parseResult = await this.callPythonParser(attachmentPath, filename);

      if (!parseResult.success) {
        console.log(`❌ AI Parse failed at stage: ${parseResult.stage}`);
        console.log(`   Errors: ${parseResult.errors.join(', ')}`);
        
        return {
          success: false,
          error: parseResult.errors.join('; ')
        };
      }

      console.log(`✅ AI Parse successful (confidence: ${(parseResult.confidence * 100).toFixed(1)}%)`);

      // Convert to RecruiterResume format
      const resumeData = this.convertToResumeFormat(parseResult.data, emailData, attachmentPath);

      // Save to database
      const resume = await RecruiterResume.create(resumeData);

      console.log(`✅ Resume saved: ${resume._id}`);

      return {
        success: true,
        resume: resume.toObject()
      };

    } catch (error: any) {
      console.error('❌ AI Resume processing error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Call Python AI parser script
   */
  private async callPythonParser(
    attachmentPath: string,
    filename: string
  ): Promise<AIParseResult> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import sys
import json
sys.path.insert(0, '${path.dirname(this.scriptPath)}')
from ai_resume_parser import process_outlook_resume_attachment

result = process_outlook_resume_attachment('${attachmentPath.replace(/\\/g, '\\\\')}', '${filename}')
print(json.dumps(result))
`;

      const pythonProcess = spawn(this.pythonPath, ['-c', pythonScript]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Extract JSON from stdout (may have other logs)
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            reject(new Error('No JSON output from Python parser'));
            return;
          }

          const result = JSON.parse(jsonMatch[0]);
          resolve(result);
        } catch (error: any) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python parser timeout'));
      }, 60000);
    });
  }

  /**
   * Convert AI parsed data to RecruiterResume format
   */
  private convertToResumeFormat(
    aiData: any,
    emailData: { from: string; subject: string; receivedDate: Date },
    filePath: string
  ): any {
    // Extract experience years from experience array
    const experienceYears = aiData.experience?.length > 0
      ? aiData.experience.length * 2 // Rough estimate: 2 years per job
      : 0;

    // Determine experience level based on years
    let experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' = 'Entry';
    if (experienceYears >= 10) experienceLevel = 'Lead';
    else if (experienceYears >= 7) experienceLevel = 'Senior';
    else if (experienceYears >= 3) experienceLevel = 'Mid';

    return {
      // Basic Info
      name: aiData.name || 'Unknown Candidate',
      email: aiData.email || emailData.from,
      phone: aiData.phone || '',
      location: aiData.location || '',

      // Professional Info
      currentTitle: aiData.experience?.[0]?.title || '',
      currentCompany: aiData.experience?.[0]?.company || '',
      summary: aiData.summary || '',
      
      // Skills
      skills: aiData.skills || [],
      
      // Experience
      experienceYears: experienceYears,
      experienceLevel: experienceLevel,
      workHistory: aiData.experience?.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        description: exp.description,
        duration: ''
      })) || [],

      // Education
      education: aiData.education?.map((edu: any) => ({
        degree: edu.degree,
        institution: edu.institution,
        year: edu.year,
        field: ''
      })) || [],

      // Certifications
      certifications: aiData.certifications || [],

      // Source Info
      source: 'outlook',
      sourceMetadata: {
        emailFrom: emailData.from,
        emailSubject: emailData.subject,
        receivedDate: emailData.receivedDate,
        originalFilename: path.basename(filePath)
      },

      // File Info
      resumeFile: {
        filename: path.basename(filePath),
        path: filePath,
        mimetype: this.getMimeType(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
      },

      // Status
      status: 'active',
      tags: ['ai-parsed', 'outlook-import'],

      // Timestamps
      dateAdded: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Batch process multiple attachments
   */
  async processMultipleResumes(
    attachments: Array<{ path: string; filename: string }>,
    emailData: { from: string; subject: string; receivedDate: Date }
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{ filename: string; success: boolean; resume?: any; error?: string }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const attachment of attachments) {
      const result = await this.processResumeAttachment(
        attachment.path,
        attachment.filename,
        emailData
      );

      results.push({
        filename: attachment.filename,
        ...result
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return { successful, failed, results };
  }

  /**
   * Get AI parser statistics
   */
  async getParserStats(): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    averageConfidence: number;
  }> {
    // Get all resumes parsed with AI
    const aiResumes = await RecruiterResume.find({
      tags: 'ai-parsed',
      source: 'outlook'
    });

    const totalProcessed = aiResumes.length;
    const successful = aiResumes.filter(r => r.email && r.skills?.length > 0).length;
    const failed = totalProcessed - successful;

    // Average confidence would require storing it in the resume document
    // For now, return a placeholder
    const averageConfidence = successful / totalProcessed || 0;

    return {
      totalProcessed,
      successful,
      failed,
      averageConfidence
    };
  }
}

export default new AIResumeParserService();
