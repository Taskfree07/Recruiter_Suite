import fs from 'fs';
import path from 'path';
import RecruiterResume from '../models/recruiterResume';
import recruiterParserService from './recruiterParserService';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface EmailMessage {
  from: string;
  subject: string;
  date: Date;
  body: string;
  attachments: EmailAttachment[];
}

class EmailService {
  private uploadsDir: string;

  constructor() {
    // Set up uploads directory for recruiter resumes
    this.uploadsDir = path.join(__dirname, '../../uploads/recruiter-resumes');

    // Create directory if it doesn't exist
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Process email attachments and save resumes to database
   * This is the main function that will be called when emails are fetched
   */
  async processEmailAttachments(emails: EmailMessage[]): Promise<any[]> {
    const processedResumes = [];

    for (const email of emails) {
      // Filter for PDF and DOCX attachments only
      const resumeAttachments = email.attachments.filter(att => {
        const ext = path.extname(att.filename).toLowerCase();
        return ['.pdf', '.docx', '.doc'].includes(ext);
      });

      for (const attachment of resumeAttachments) {
        try {
          const resume = await this.processResumeAttachment(attachment, email);
          processedResumes.push(resume);
        } catch (error) {
          console.error(`Error processing attachment ${attachment.filename}:`, error);
        }
      }
    }

    return processedResumes;
  }

  /**
   * Process individual resume attachment
   */
  private async processResumeAttachment(
    attachment: EmailAttachment,
    email: EmailMessage
  ): Promise<any> {
    // Save file to disk
    const fileName = `${Date.now()}_${attachment.filename}`;
    const filePath = path.join(this.uploadsDir, fileName);

    fs.writeFileSync(filePath, attachment.content);

    try {
      // Parse resume using recruiter parser service
      const parsedData = await recruiterParserService.parseResumeForRecruiter(filePath);

      // Calculate freshness score (newer = better)
      const daysSinceReceived = Math.floor(
        (Date.now() - email.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      const freshnessScore = Math.max(0, 100 - (daysSinceReceived * 2));

      // Calculate initial scores
      const scores = this.calculateInitialScores(parsedData, freshnessScore);

      // Create resume document
      const resume = new RecruiterResume({
        personalInfo: parsedData.personalInfo,
        professionalDetails: parsedData.professionalDetails,
        skills: parsedData.skills,
        categories: parsedData.categories,
        experience: parsedData.experience,
        education: parsedData.education,
        certifications: parsedData.certifications,
        projects: parsedData.projects,
        source: {
          type: 'email',
          email: email.from,
          subject: email.subject,
          receivedDate: email.date,
          emailBody: email.body.substring(0, 500)
        },
        file: {
          fileName: attachment.filename,
          filePath: filePath,
          fileType: path.extname(attachment.filename).toLowerCase().replace('.', '')
        },
        scores: scores,
        status: 'pending_review',
        tags: parsedData.categories.specificSkills,
        rawText: parsedData.rawText,
        processed: true
      });

      await resume.save();
      return resume;

    } catch (error) {
      console.error('Error parsing resume:', error);

      // Save with error status
      const resume = new RecruiterResume({
        personalInfo: {
          name: 'Unknown',
          email: '',
          phone: '',
          location: ''
        },
        source: {
          type: 'email',
          email: email.from,
          subject: email.subject,
          receivedDate: email.date,
          emailBody: email.body.substring(0, 500)
        },
        file: {
          fileName: attachment.filename,
          filePath: filePath,
          fileType: path.extname(attachment.filename).toLowerCase().replace('.', '')
        },
        processed: false,
        processingErrors: [(error as Error).message],
        status: 'pending_review'
      });

      await resume.save();
      return resume;
    }
  }

  /**
   * Calculate initial scores for resume
   */
  private calculateInitialScores(parsedData: any, freshnessScore: number): any {
    // Skill relevance score based on number of skills found
    const totalSkills =
      parsedData.skills.primary.length +
      parsedData.skills.frameworks.length +
      parsedData.skills.databases.length +
      parsedData.skills.cloudPlatforms.length;

    const skillRelevance = Math.min(100, totalSkills * 10);

    // Experience quality score
    const experienceQuality = Math.min(100, parsedData.professionalDetails.totalExperience * 15);

    // Education score (basic)
    const educationScore = parsedData.education.length > 0 ? 75 : 50;

    // Resume quality score (based on data completeness)
    const hasEmail = parsedData.personalInfo.email ? 25 : 0;
    const hasPhone = parsedData.personalInfo.phone ? 25 : 0;
    const hasExperience = parsedData.experience.length > 0 ? 25 : 0;
    const hasEducation = parsedData.education.length > 0 ? 25 : 0;
    const resumeQuality = hasEmail + hasPhone + hasExperience + hasEducation;

    // Overall score (weighted average)
    const overall = Math.round(
      (skillRelevance * 0.3) +
      (experienceQuality * 0.25) +
      (educationScore * 0.15) +
      (freshnessScore * 0.15) +
      (resumeQuality * 0.15)
    );

    return {
      overall,
      skillRelevance,
      experienceQuality,
      educationScore,
      freshnessScore,
      resumeQuality
    };
  }

  /**
   * DEMO/TEST FUNCTION: Simulate email fetch from a local folder
   * For quick testing without Gmail OAuth setup
   * Assigns realistic demo dates with strategic distribution
   */
  async simulateEmailFetchFromFolder(folderPath: string): Promise<any[]> {
    console.log(`Simulating email fetch from folder: ${folderPath}`);

    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    // Get all PDF, DOCX, and TXT files from folder (TXT for demo purposes)
    const files = fs.readdirSync(folderPath).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.pdf', '.docx', '.doc', '.txt'].includes(ext);
    });

    console.log(`Found ${files.length} resume files`);

    // Generate realistic demo dates with better distribution
    const generateDemoDate = (index: number, total: number): Date => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Distribution strategy:
      // 20% - Today
      // 30% - Last 3 days
      // 30% - Last 7 days
      // 20% - Last 30 days

      const random = Math.random();
      let daysAgo: number;

      if (random < 0.2) {
        // Today (0-8 hours ago)
        daysAgo = Math.random() * 0.33;
      } else if (random < 0.5) {
        // Last 3 days
        daysAgo = 1 + Math.random() * 2;
      } else if (random < 0.8) {
        // Last 7 days
        daysAgo = 3 + Math.random() * 4;
      } else {
        // Last 30 days
        daysAgo = 7 + Math.random() * 23;
      }

      return new Date(now - (daysAgo * oneDayMs));
    };

    // Create mock email messages with varied dates
    const mockEmails: EmailMessage[] = files.map((file, index) => {
      const demoDate = generateDemoDate(index, files.length);
      const senderNames = ['talent', 'career', 'hr', 'jobs', 'recruitment', 'apply', 'candidate'];
      const senderName = senderNames[Math.floor(Math.random() * senderNames.length)];

      return {
        from: `${senderName}${Math.floor(Math.random() * 999)}@${['gmail.com', 'outlook.com', 'yahoo.com'][Math.floor(Math.random() * 3)]}`,
        subject: `Application: ${file.replace(/\.(pdf|docx|doc)$/i, '')}`,
        date: demoDate,
        body: `Dear Hiring Manager,\n\nPlease find attached my resume for your consideration.\n\nBest regards`,
        attachments: [{
          filename: file,
          content: fs.readFileSync(path.join(folderPath, file)),
          contentType: path.extname(file) === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }]
      };
    });

    // Sort by date (newest first) before processing
    mockEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

    console.log(`Processing ${mockEmails.length} resumes...`);
    console.log(`Date range: ${mockEmails[mockEmails.length - 1].date.toLocaleDateString()} to ${mockEmails[0].date.toLocaleDateString()}`);

    // Process emails
    return await this.processEmailAttachments(mockEmails);
  }

  /**
   * Process a single resume file (for manual uploads)
   */
  async processResumeFile(
    filePath: string,
    originalFilename: string,
    sourceInfo: { type: string; receivedDate: Date }
  ): Promise<any> {
    try {
      // Parse resume using recruiter parser service
      const parsedData = await recruiterParserService.parseResumeForRecruiter(filePath);

      // Calculate freshness score (newer = better)
      const daysSinceReceived = Math.floor(
        (Date.now() - sourceInfo.receivedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const freshnessScore = Math.max(0, 100 - (daysSinceReceived * 2));

      // Calculate initial scores
      const scores = this.calculateInitialScores(parsedData, freshnessScore);

      // Create resume document
      const resume = new RecruiterResume({
        personalInfo: parsedData.personalInfo,
        professionalDetails: parsedData.professionalDetails,
        skills: parsedData.skills,
        categories: parsedData.categories,
        experience: parsedData.experience,
        education: parsedData.education,
        certifications: parsedData.certifications,
        projects: parsedData.projects,
        source: {
          type: sourceInfo.type,
          receivedDate: sourceInfo.receivedDate,
        },
        file: {
          fileName: originalFilename,
          filePath: filePath,
          fileType: path.extname(originalFilename).toLowerCase().replace('.', '')
        },
        scores: scores,
        status: 'pending_review',
        tags: parsedData.categories.specificSkills,
        rawText: parsedData.rawText,
        processed: true
      });

      await resume.save();
      console.log(`✅ Saved resume for ${parsedData.personalInfo.name}`);
      return resume;

    } catch (error) {
      console.error('Error parsing resume:', error);

      // Save with error status
      const resume = new RecruiterResume({
        personalInfo: {
          name: 'Unknown',
          email: '',
          phone: '',
          location: ''
        },
        source: {
          type: sourceInfo.type,
          receivedDate: sourceInfo.receivedDate,
        },
        file: {
          fileName: originalFilename,
          filePath: filePath,
          fileType: path.extname(originalFilename).toLowerCase().replace('.', '')
        },
        processed: false,
        processingErrors: [(error as Error).message],
        status: 'pending_review'
      });

      await resume.save();
      return resume;
    }
  }

  /**
   * Get Gmail OAuth URL for user authorization
   * This would be implemented when ready to connect real Gmail
   */
  getGmailAuthUrl(): string {
    // TODO: Implement Gmail OAuth flow
    return 'https://accounts.google.com/o/oauth2/v2/auth?...';
  }

  /**
   * Fetch emails from Gmail (to be implemented with OAuth)
   */
  async fetchFromGmail(accessToken: string, labelFilter?: string): Promise<EmailMessage[]> {
    // TODO: Implement Gmail API integration
    // This will use googleapis library to:
    // 1. List messages with attachments
    // 2. Filter by label (e.g., "Resumes")
    // 3. Download attachments
    // 4. Return EmailMessage[] array

    throw new Error('Gmail integration not yet implemented. Use simulateEmailFetchFromFolder() for testing.');
  }
}

export default new EmailService();
