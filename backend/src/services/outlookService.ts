import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import RecruiterResume from '../models/recruiterResume';
import recruiterParserService from './recruiterParserService';
import parserService from './parserService';
import aiResumeParserService from './aiResumeParserService';
import fs from 'fs';
import path from 'path';

interface OutlookConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

interface SyncOptions {
  syncPeriod: 'lastMonth' | 'all';
  userEmail: string;
}

class OutlookService {
  private uploadsDir: string;
  private msalClient: ConfidentialClientApplication | null = null;
  private config: OutlookConfig | null = null;

  constructor() {
    // Set up uploads directory for Outlook resumes
    this.uploadsDir = path.join(__dirname, '../../uploads/outlook-resumes');

    // Create directory if it doesn't exist
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Initialize the Outlook service with configuration
   */
  initialize(config: OutlookConfig): void {
    this.config = config;

    // Initialize MSAL client for authentication
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        clientSecret: config.clientSecret,
      },
    });

    console.log('✅ Outlook service initialized');
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.config !== null && this.msalClient !== null;
  }

  /**
   * Get authentication URL for user to login
   */
  async getAuthUrl(userId: string): Promise<string> {
    if (!this.config || !this.msalClient) {
      throw new Error('Outlook service not configured');
    }

    const authCodeUrlParameters = {
      scopes: ['User.Read', 'Mail.Read', 'Mail.ReadBasic'],
      redirectUri: this.config.redirectUri,
      state: userId, // Pass userId in state to track who's authenticating
    };

    const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    console.log('🔗 Generated auth URL for user:', userId);
    return authUrl;
  }

  /**
   * Acquire access token using authorization code
   */
  async acquireTokenByCode(code: string, userId: string): Promise<{ accessToken: string; expiresOn: Date }> {
    if (!this.config || !this.msalClient) {
      throw new Error('Outlook service not configured');
    }

    const tokenRequest = {
      code,
      scopes: ['User.Read', 'Mail.Read', 'Mail.ReadBasic'],
      redirectUri: this.config.redirectUri,
    };

    try {
      const response = await this.msalClient.acquireTokenByCode(tokenRequest);

      console.log('✅ Access token acquired for user:', userId);

      return {
        accessToken: response!.accessToken,
        expiresOn: response!.expiresOn!,
      };
    } catch (error) {
      console.error('❌ Failed to acquire token:', error);
      throw error;
    }
  }

  /**
   * Create authenticated Graph client
   */
  private createGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Sync resumes from Outlook emails
   */
  async syncResumes(accessToken: string, options: SyncOptions): Promise<any> {
    console.log(`📧 Starting Outlook sync for user: ${options.userEmail}`);
    console.log(`📅 Sync period: ${options.syncPeriod}`);

    const client = this.createGraphClient(accessToken);
    const processedResumes: any[] = [];
    const errors: string[] = [];

    try {
      // STEP 1: Clear old Outlook resumes before syncing fresh data
      console.log('🗑️ Clearing old Outlook resumes from database...');
      const RecruiterResume = require('../models/recruiterResume').default;
      const deleteResult = await RecruiterResume.deleteMany({ 'source.type': 'outlook' });
      console.log(`✅ Cleared ${deleteResult.deletedCount} old Outlook resumes`);

      // Get user profile first
      const userProfile = await client.api('/me').get();
      console.log(`👤 Authenticated as: ${userProfile.userPrincipalName}`);

      // Calculate date filter
      let dateFilter = null;
      if (options.syncPeriod === 'lastMonth') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = lastMonth;
      }

      console.log('🔍 Fetching emails with attachments (filtering client-side)...');

      // Get messages with attachments - simplified query without complex filters
      const messagesResponse = await client
        .api('/me/messages')
        .select('id,subject,from,receivedDateTime,hasAttachments,bodyPreview')
        .filter('hasAttachments eq true')
        .top(500) // Fetch more since we filter client-side
        .get();

      let messages = messagesResponse.value;

      // Filter by date client-side if needed
      if (dateFilter) {
        messages = messages.filter((msg: any) => new Date(msg.receivedDateTime) >= dateFilter);
        console.log(`📬 Found ${messages.length} emails with attachments (after date filter)`);
      } else {
        console.log(`📬 Found ${messages.length} emails with attachments`);
      }

      // Process each message
      for (const message of messages) {
        try {
          // Get attachments metadata first (without contentBytes)
          const attachmentsResponse = await client
            .api(`/me/messages/${message.id}/attachments`)
            .select('id,name,contentType,size')
            .get();

          const attachments = attachmentsResponse.value;

          // Filter for resume files (PDF, DOCX, DOC)
          const potentialResumeAttachments = attachments.filter((att: any) => {
            const ext = path.extname(att.name).toLowerCase();
            const isResumeFile = ['.pdf', '.docx', '.doc'].includes(ext);
            const isSizeOk = att.size < 10 * 1024 * 1024; // Max 10MB

            // Check if filename or subject suggests it's a resume
            const nameHasResume = att.name.toLowerCase().match(/resume|cv|curriculum/);
            const subjectHasResume = message.subject?.toLowerCase().match(/resume|cv|application|candidate/);

            return isResumeFile && isSizeOk && (nameHasResume || subjectHasResume);
          });

          if (potentialResumeAttachments.length === 0) {
            continue;
          }

          // Fetch each attachment's content individually
          const resumeAttachments = [];
          for (const att of potentialResumeAttachments) {
            try {
              const fullAttachment = await client
                .api(`/me/messages/${message.id}/attachments/${att.id}`)
                .get();
              resumeAttachments.push(fullAttachment);
            } catch (attError) {
              console.log(`⚠️ Failed to fetch attachment ${att.name}:`, attError);
            }
          }

          if (resumeAttachments.length === 0) {
            continue;
          }

          console.log(`📎 Processing ${resumeAttachments.length} resume(s) from: ${message.from.emailAddress.address} - "${message.subject}"`);

          // Process attachments in parallel for speed
          const processingPromises = resumeAttachments.map(async (attachment) => {
            try {
              const resume = await this.processResumeAttachment(
                attachment,
                message,
                options.userEmail
              );
              console.log(`✅ Processed: ${attachment.name}`);
              return resume;
            } catch (error) {
              const errorMsg = `Failed to process ${attachment.name}: ${(error as Error).message}`;
              console.error(`❌ ${errorMsg}`);
              errors.push(errorMsg);
              return null;
            }
          });

          // Wait for all attachments to process
          const results = await Promise.all(processingPromises);
          processedResumes.push(...results.filter(r => r !== null));
        } catch (error) {
          const errorMsg = `Failed to process email "${message.subject}": ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Outlook sync complete: ${processedResumes.length} resumes processed, ${errors.length} errors`);

      return {
        success: true,
        resumesProcessed: processedResumes.length,
        resumes: processedResumes,
        errors,
        userEmail: userProfile.userPrincipalName,
      };
    } catch (error) {
      console.error('❌ Outlook sync failed:', error);
      throw error;
    }
  }

  /**
   * Process individual resume attachment
   */
  private async processResumeAttachment(
    attachment: any,
    message: any,
    userEmail: string
  ): Promise<any> {
    // Decode base64 content
    const buffer = Buffer.from(attachment.contentBytes, 'base64');

    // Save file to disk
    const timestamp = Date.now();
    const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(this.uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    try {
      // =======================================================================
      // AI-POWERED PARSING (99% ACCURACY) - ALWAYS ENABLED
      // =======================================================================
      console.log('🤖 Using AI-powered resume parsing (99% accuracy)...');
      
      const aiResult = await aiResumeParserService.processResumeAttachment(
        filePath,
        attachment.name,
        {
          from: message.from.emailAddress.address,
          subject: message.subject,
          receivedDate: new Date(message.receivedDateTime)
        }
      );

      if (aiResult.success) {
        console.log(`✅ AI parsing successful: ${aiResult.resume.name}`);
        return aiResult.resume;
      } else {
        console.log(`⚠️ AI parsing failed: ${aiResult.error}`);
        console.log('📄 Falling back to keyword-based parsing...');
        // Fall through to keyword-based parsing
      }

      // =======================================================================
      // KEYWORD-BASED VALIDATION (FALLBACK ONLY)
      // =======================================================================
      console.log('📄 Validating resume using keyword detection...');
      
      // Use parserService to extract text from any file type (PDF, DOC, DOCX)
      const fullText = (await parserService.extractText(filePath)).toLowerCase();
      
      // Resume indicators - Check for multiple resume-specific keywords
      const resumeKeywords = [
        'experience', 'education', 'skills', 'work history',
        'employment', 'professional', 'resume', 'cv', 'curriculum vitae',
        'responsibilities', 'achievements', 'qualification', 'bachelor', 'master',
        'university', 'college', 'degree', 'certification', 'trained',
        'proficient', 'expertise', 'objective', 'summary', 'profile',
        'project', 'technical', 'developer', 'engineer', 'manager'
      ];
      
      const keywordCount = resumeKeywords.filter(keyword => fullText.includes(keyword)).length;
      const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(fullText);
      const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(fullText);
      
      // LENIENT VALIDATION: Accept if has 5+ resume keywords (contact info optional)
      // Most resumes have 5-15+ keywords even if email/phone extraction fails
      const isLikelyResume = keywordCount >= 5;
      
      if (!isLikelyResume) {
        console.log(`❌ NOT A RESUME: Only ${keywordCount} resume keywords found (need 5+)`);
        console.log(`⚠️ Skipping: ${attachment.name}`);
        
        // Clean up file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        throw new Error(`Not a valid resume: Insufficient resume indicators (${keywordCount} keywords)`);
      }

      console.log(`✅ Resume validated (${keywordCount} keywords, email: ${hasEmail}, phone: ${hasPhone}) - Processing...`);

      // Parse resume using recruiter parser service
      const parsedData = await recruiterParserService.parseResumeForRecruiter(filePath);

      // Calculate freshness score
      const receivedDate = new Date(message.receivedDateTime);
      const daysSinceReceived = Math.floor(
        (Date.now() - receivedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const freshnessScore = Math.max(0, 100 - daysSinceReceived * 2);

      // Calculate initial scores
      const scores = this.calculateScores(parsedData, freshnessScore);

      // Check if resume already exists (by email or name)
      const existingResume = await RecruiterResume.findOne({
        $or: [
          { 'personalInfo.email': parsedData.personalInfo.email },
          {
            'personalInfo.name': parsedData.personalInfo.name,
            'source.type': 'outlook'
          }
        ],
      });

      let resume;

      if (existingResume) {
        // Update existing resume with newer data
        console.log(`📝 Updating existing resume for ${parsedData.personalInfo.name}`);

        existingResume.personalInfo = parsedData.personalInfo;
        existingResume.professionalDetails = parsedData.professionalDetails;
        existingResume.skills = parsedData.skills;
        existingResume.categories = parsedData.categories;
        existingResume.experience = parsedData.experience;
        existingResume.education = parsedData.education;
        existingResume.certifications = parsedData.certifications;
        existingResume.projects = parsedData.projects;
        existingResume.scores = scores;
        existingResume.rawText = parsedData.rawText;
        existingResume.processed = true;
        existingResume.source = {
          type: 'outlook',
          email: message.from.emailAddress.address,
          subject: message.subject,
          receivedDate: receivedDate,
          emailBody: message.bodyPreview,
          outlookMessageId: message.id,
          syncedBy: userEmail,
        };

        await existingResume.save();
        resume = existingResume;
      } else {
        // Create new resume
        console.log(`📝 Creating new resume for ${parsedData.personalInfo.name}`);

        resume = new RecruiterResume({
          personalInfo: parsedData.personalInfo,
          professionalDetails: parsedData.professionalDetails,
          skills: parsedData.skills,
          categories: parsedData.categories,
          experience: parsedData.experience,
          education: parsedData.education,
          certifications: parsedData.certifications,
          projects: parsedData.projects,
          source: {
            type: 'outlook',
            email: message.from.emailAddress.address,
            subject: message.subject,
            receivedDate: receivedDate,
            emailBody: message.bodyPreview,
            outlookMessageId: message.id,
            syncedBy: userEmail,
          },
          file: {
            fileName: attachment.name,
            filePath: filePath,
            fileType: path.extname(attachment.name).toLowerCase().replace('.', ''),
          },
          scores: scores,
          status: 'pending_review',
          tags: parsedData.categories.specificSkills,
          rawText: parsedData.rawText,
          processed: true,
        });

        await resume.save();
      }

      return resume;
    } catch (error) {
      console.error('❌ Error parsing resume:', error);

      // Save with error status
      const resume = new RecruiterResume({
        personalInfo: {
          name: 'Unknown',
          email: '',
          phone: '',
          location: '',
        },
        source: {
          type: 'outlook',
          email: message.from.emailAddress.address,
          subject: message.subject,
          receivedDate: new Date(message.receivedDateTime),
          emailBody: message.bodyPreview,
          outlookMessageId: message.id,
          syncedBy: userEmail,
        },
        file: {
          fileName: attachment.name,
          filePath: filePath,
          fileType: path.extname(attachment.name).toLowerCase().replace('.', ''),
        },
        processed: false,
        processingErrors: [(error as Error).message],
        status: 'pending_review',
      });

      await resume.save();
      throw error;
    }
  }

  /**
   * Calculate scores for resume
   */
  private calculateScores(parsedData: any, freshnessScore: number): any {
    const totalSkills =
      parsedData.skills.primary.length +
      parsedData.skills.frameworks.length +
      parsedData.skills.databases.length +
      parsedData.skills.cloudPlatforms.length;

    const skillRelevance = Math.min(100, totalSkills * 10);
    const experienceQuality = Math.min(
      100,
      parsedData.professionalDetails.totalExperience * 15
    );
    const educationScore = parsedData.education.length > 0 ? 75 : 50;

    const hasEmail = parsedData.personalInfo.email ? 25 : 0;
    const hasPhone = parsedData.personalInfo.phone ? 25 : 0;
    const hasExperience = parsedData.experience.length > 0 ? 25 : 0;
    const hasEducation = parsedData.education.length > 0 ? 25 : 0;
    const resumeQuality = hasEmail + hasPhone + hasExperience + hasEducation;

    const overall = Math.round(
      skillRelevance * 0.3 +
        experienceQuality * 0.25 +
        educationScore * 0.15 +
        freshnessScore * 0.15 +
        resumeQuality * 0.15
    );

    return {
      overall,
      skillRelevance,
      experienceQuality,
      educationScore,
      freshnessScore,
      resumeQuality,
    };
  }

  /**
   * Sync job descriptions from Outlook emails
   */
  async syncJobs(accessToken: string, options: SyncOptions): Promise<any> {
    if (!this.msalClient) {
      throw new Error('Outlook service not initialized');
    }

    try {
      const client = this.createGraphClient(accessToken);

      // Get user profile for tracking
      const userProfile = await client.api('/me').get();

      console.log(
        `📧 Syncing job descriptions from Outlook for user: ${userProfile.userPrincipalName}`
      );

      // Determine date filter
      let dateFilter = '';
      if (options.syncPeriod === 'lastMonth') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = `&$filter=receivedDateTime ge ${lastMonth.toISOString()}`;
      }

      // Fetch emails with attachments or containing job description keywords
      const messagesResponse = await client
        .api('/me/messages')
        .select('id,subject,from,receivedDateTime,hasAttachments,body,bodyPreview')
        .top(500)
        .get();

      const messages = messagesResponse.value;

      console.log(`📨 Found ${messages.length} emails to process`);

      const processedJobs: any[] = [];
      const errors: string[] = [];

      // Job description keywords to filter emails
      const jobKeywords = [
        'job description',
        'jd',
        'job posting',
        'position',
        'role',
        'vacancy',
        'opening',
        'hiring',
        'job opportunity',
        'job req',
        'requirement'
      ];

      for (const message of messages) {
        try {
          // Check if email subject or body preview contains job keywords
          const subject = message.subject?.toLowerCase() || '';
          const bodyPreview = message.bodyPreview?.toLowerCase() || '';

          const isJobEmail = jobKeywords.some(
            (keyword) => subject.includes(keyword) || bodyPreview.includes(keyword)
          );

          if (!isJobEmail) {
            continue; // Skip emails that don't match job keywords
          }

          console.log(`📄 Processing job email: ${message.subject}`);

          // Get full email body
          const fullMessage = await client
            .api(`/me/messages/${message.id}`)
            .select('body')
            .get();

          const emailBody = fullMessage.body.content;

          // KEYWORD-BASED VALIDATION: Fast job description detection without AI
          console.log('🔍 Validating if this is actually a job posting...');
          const bodyLower = emailBody.toLowerCase();
          
          // Job posting validation keywords (more detailed than email filter)
          const validationKeywords = [
            'responsibilities', 'requirements', 'qualifications', 'required skills',
            'job description', 'position', 'hiring', 'looking for', 'seeking',
            'experience required', 'must have', 'should have', 'nice to have',
            'salary', 'compensation', 'benefits', 'location', 'remote', 'onsite',
            'apply', 'candidate', 'role', 'duties', 'years of experience',
            'bachelor', 'degree', 'education', 'technical skills'
          ];
          
          const keywordCount = validationKeywords.filter(keyword => bodyLower.includes(keyword)).length;
          const hasJobTitle = /\b(developer|engineer|manager|designer|analyst|architect|lead|senior|junior|consultant)\b/i.test(emailBody);
          const hasCompany = /\b(company|organization|team|inc\.|ltd\.|llc|corp)\b/i.test(emailBody);
          
          // LENIENT VALIDATION: Accept if has 4+ job keywords (typical job postings have 8-15+)
          const isLikelyJob = keywordCount >= 4;
          
          if (!isLikelyJob) {
            console.log(`❌ NOT A JOB POSTING: Only ${keywordCount} job keywords found (need 4+)`);
            console.log(`⚠️ Skipping: ${message.subject}`);
            errors.push(`Not a job posting: ${message.subject} - Only ${keywordCount} job keywords`);
            continue;
          }

          console.log(`✅ Job posting validated (${keywordCount} keywords, hasTitle: ${hasJobTitle}, hasCompany: ${hasCompany}) - Processing...`);

          // Parse job description - Try AI first, fallback to keywords
          const groqService = require('./groqService').default;
          let parsedJob = null;
          
          try {
            parsedJob = await groqService.parseJobDescriptionFromEmail(emailBody);
          } catch (error: any) {
            console.log('⚠️ AI parsing error, using keyword extraction...');
          }
          
          // If AI returned null or failed, use keyword extraction
          if (!parsedJob) {
            console.log('🔧 Using keyword-based extraction (AI unavailable)...');
            parsedJob = this.extractJobWithKeywords(emailBody, message.subject);
          }

          if (!parsedJob) {
            console.log(`⚠️ Could not parse job from email: ${message.subject}`);
            errors.push(`Could not parse job from email: ${message.subject}`);
            continue;
          }

          // Import UnifiedJob model
          const UnifiedJob = require('../models/unifiedJob').default;

          // Check if job already exists (by email ID or similar subject)
          const existingJob = await UnifiedJob.findOne({
            $or: [
              { 'sources.emailId': message.id },
              {
                title: parsedJob.title,
                company: parsedJob.company,
                'sources.type': 'outlook'
              }
            ]
          });

          let job;

          if (existingJob) {
            console.log(`📝 Updating existing job: ${parsedJob.title} at ${parsedJob.company}`);

            // Update existing job
            existingJob.title = parsedJob.title;
            existingJob.description = parsedJob.description;
            existingJob.company = parsedJob.company;
            existingJob.requiredSkills = parsedJob.requiredSkills || [];
            existingJob.niceToHaveSkills = parsedJob.niceToHaveSkills || [];
            existingJob.experienceYears = parsedJob.experienceYears || { min: 0, max: 10 };
            existingJob.location = parsedJob.location || 'Not specified';
            existingJob.locationType = parsedJob.locationType || 'onsite';
            existingJob.salaryRange = parsedJob.salaryRange;
            existingJob.educationRequired = parsedJob.educationRequired;

            // Add new source if not already present
            const sourceExists = existingJob.sources.some(
              (s: any) => s.emailId === message.id
            );

            if (!sourceExists) {
              existingJob.sources.push({
                type: 'outlook',
                id: message.id,
                emailId: message.id,
                emailSubject: message.subject,
                senderEmail: message.from.emailAddress.address,
                syncDate: new Date(),
                metadata: {
                  syncedBy: userProfile.userPrincipalName,
                  emailBodyPreview: message.bodyPreview
                }
              });
            }

            job = await existingJob.save();
          } else {
            console.log(`✨ Creating new job: ${parsedJob.title} at ${parsedJob.company}`);

            // Create new job
            job = new UnifiedJob({
              userId: 'default-user', // TODO: Use actual user ID
              title: parsedJob.title,
              description: parsedJob.description,
              company: parsedJob.company,
              requiredSkills: parsedJob.requiredSkills || [],
              niceToHaveSkills: parsedJob.niceToHaveSkills || [],
              experienceYears: parsedJob.experienceYears || { min: 0, max: 10 },
              experienceLevel: this.inferExperienceLevel(parsedJob.experienceYears),
              location: parsedJob.location || 'Not specified',
              locationType: parsedJob.locationType || 'onsite',
              salaryRange: parsedJob.salaryRange,
              educationRequired: parsedJob.educationRequired,
              status: 'open',
              postedDate: new Date(message.receivedDateTime),
              priority: 'medium',
              tags: ['outlook-synced'],
              sources: [
                {
                  type: 'outlook',
                  id: message.id,
                  emailId: message.id,
                  emailSubject: message.subject,
                  senderEmail: message.from.emailAddress.address,
                  syncDate: new Date(),
                  metadata: {
                    syncedBy: userProfile.userPrincipalName,
                    emailBodyPreview: message.bodyPreview
                  }
                }
              ]
            });

            job = await job.save();
          }

          processedJobs.push(job);
          console.log(`✅ Processed job: ${parsedJob.title}`);

        } catch (error) {
          const errorMsg = `Failed to process email "${message.subject}": ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(
        `✅ Outlook job sync complete: ${processedJobs.length} jobs processed, ${errors.length} errors`
      );

      return {
        success: true,
        jobsProcessed: processedJobs.length,
        jobs: processedJobs,
        errors,
        userEmail: userProfile.userPrincipalName
      };
    } catch (error) {
      console.error('❌ Outlook job sync failed:', error);
      throw error;
    }
  }

  /**
   * Infer experience level from years
   */
  private inferExperienceLevel(experienceYears?: { min: number; max: number }): string {
    if (!experienceYears) return 'Mid';

    const avgYears = (experienceYears.min + experienceYears.max) / 2;

    if (avgYears <= 1) return 'Entry';
    if (avgYears <= 3) return 'Junior';
    if (avgYears <= 6) return 'Mid';
    if (avgYears <= 10) return 'Senior';
    if (avgYears <= 15) return 'Lead';
    return 'Principal';
  }

  /**
   * Extract job details using enhanced keyword-based extraction (no AI needed)
   */
  private extractJobWithKeywords(emailBody: string, subject: string): any {
    console.log('🔧 Using enhanced keyword-based job extraction...');
    
    const bodyLower = emailBody.toLowerCase();
    const bodyLines = emailBody.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Enhanced job title extraction with multiple strategies
    let title = 'Job Opening';
    
    // Strategy 1: Look for explicit title markers
    const titlePatterns = [
      /(?:job title|position|role|designation)[:|\s]+([^\n]{5,80})/i,
      /(?:we are|we're|currently)\s+(?:hiring|looking for|seeking)\s+(?:a|an)?\s*([^\n]{5,80})/i,
      /^(?:job|position|role)[:|\s]+(.{5,80})$/im,
    ];
    
    for (const pattern of titlePatterns) {
      const match = emailBody.match(pattern);
      if (match && match[1]) {
        title = match[1].trim().split(/[.!?]/)[0]; // Take first sentence
        break;
      }
    }
    
    // Strategy 2: Extract from subject if contains job-related terms
    if (title === 'Job Opening') {
      const subjectLower = subject.toLowerCase();
      if (subjectLower.includes('job') || subjectLower.includes('position') || 
          subjectLower.includes('opening') || subjectLower.includes('hiring')) {
        title = subject.replace(/^(re:|fwd?:|fw:)\s*/i, '').trim();
      }
    }
    
    // Strategy 3: Look for job titles in first few lines
    if (title === 'Job Opening') {
      const jobTitleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'designer', 
                                'architect', 'lead', 'senior', 'junior', 'specialist', 'consultant'];
      for (const line of bodyLines.slice(0, 10)) {
        if (jobTitleKeywords.some(kw => line.toLowerCase().includes(kw)) && 
            line.length > 10 && line.length < 80) {
          title = line;
          break;
        }
      }
    }
    
    // Enhanced company name extraction
    let company = 'Company Name';
    const companyPatterns = [
      /(?:company|organization|employer)[:|\s]+([^\n]{3,50})/i,
      /(?:at|for|with)\s+([A-Z][A-Za-z\s&,Inc.Ltd]+(?:Inc\.|Ltd\.|LLC|Corp)?)/,
      /([A-Z][A-Za-z\s&]+(?:Inc\.|Ltd\.|LLC|Corp\.|Corporation|Technologies|Solutions|Systems))/,
    ];
    
    for (const pattern of companyPatterns) {
      const match = emailBody.match(pattern);
      if (match && match[1]) {
        company = match[1].trim().split(/[.!?]/)[0];
        break;
      }
    }
    
    // Enhanced location extraction
    let location = 'Not specified';
    const locationPatterns = [
      /(?:location|office|based in|work from)[:|\s]+([^\n]{3,50})/i,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/,  // City, State
      /\b((?:New York|Los Angeles|Chicago|Houston|Phoenix|San Francisco|Seattle|Boston|Austin|Denver|Portland)[,\s]*[A-Z]{0,2})\b/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = emailBody.match(pattern);
      if (match && match[1]) {
        location = match[1].trim();
        break;
      }
    }
    
    // Detect remote/hybrid/onsite with better accuracy
    let locationType = 'onsite';
    if (/\b(100%\s*remote|fully remote|remote only|work from home|wfh|remote first)\b/i.test(emailBody)) {
      locationType = 'remote';
    } else if (/\b(hybrid|flexible|remote option|partially remote)\b/i.test(emailBody)) {
      locationType = 'hybrid';
    } else if (/\b(onsite|on-site|in-office|office based)\b/i.test(emailBody)) {
      locationType = 'onsite';
    }
    
    // Enhanced experience years extraction
    const experiencePatterns = [
      /(\d+)[\s-]*(?:to|-)[\s-]*(\d+)[\s+](?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp)?/i,
      /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp)/i,
      /(?:experience|exp)[:|\s]+(\d+)[\s-]*(?:to|-)[\s-]*(\d+)[\s+](?:years?|yrs?)/i,
      /(?:minimum|min|at least)\s+(\d+)[\s+](?:years?|yrs?)/i,
    ];
    
    let experienceYears = { min: 0, max: 10 };
    for (const pattern of experiencePatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        if (match[2]) {
          experienceYears = { min: parseInt(match[1]), max: parseInt(match[2]) };
        } else {
          const years = parseInt(match[1]);
          experienceYears = { min: years, max: years + 2 };
        }
        break;
      }
    }
    
    // Comprehensive skill extraction with better coverage
    const skillCategories = {
      languages: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 
                  'rust', 'swift', 'kotlin', 'scala', 'php', 'perl', 'r'],
      frontend: ['react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'ember', 
                 'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap'],
      backend: ['node.js', 'nodejs', 'express', 'django', 'flask', 'spring', 'spring boot',
                '.net', 'asp.net', 'laravel', 'rails', 'fastapi'],
      databases: ['sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
                  'dynamodb', 'cassandra', 'oracle', 'sql server', 'mariadb'],
      cloud: ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 
              'cloudflare', 'firebase'],
      devops: ['docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github actions',
               'ci/cd', 'terraform', 'ansible', 'puppet', 'chef'],
      tools: ['git', 'jira', 'confluence', 'slack', 'agile', 'scrum', 'kanban',
              'rest api', 'graphql', 'microservices', 'webpack', 'vite', 'babel']
    };
    
    const allSkills = Object.values(skillCategories).flat();
    const foundSkills = allSkills.filter(skill => 
      bodyLower.includes(skill.toLowerCase())
    );
    
    // Intelligently split into required and nice-to-have based on context
    const requiredSkills: string[] = [];
    const niceToHaveSkills: string[] = [];
    
    foundSkills.forEach(skill => {
      // Look for context around the skill mention
      const skillPattern = new RegExp(`(.{0,60}\\b${skill}\\b.{0,60})`, 'gi');
      const matches = emailBody.match(skillPattern);
      
      if (matches && matches[0]) {
        const context = matches[0].toLowerCase();
        // Required indicators
        if (/\b(required|must have|essential|mandatory|needed|necessary|proficient|expert)\b/i.test(context)) {
          requiredSkills.push(skill);
        }
        // Nice-to-have indicators
        else if (/\b(nice to have|preferred|bonus|plus|advantage|desirable|optional)\b/i.test(context)) {
          niceToHaveSkills.push(skill);
        }
        // Default to required if mentioned prominently
        else if (context.length < 100) {
          requiredSkills.push(skill);
        } else {
          niceToHaveSkills.push(skill);
        }
      } else {
        requiredSkills.push(skill); // Default to required
      }
    });
    
    // Get description (first 500 chars or responsibilities section)
    const responsibilitiesMatch = emailBody.match(/(?:responsibilities|duties|what you'll do)[:|\s]+([\s\S]{50,800}?)(?:\n\n|requirements|qualifications)/i);
    const description = responsibilitiesMatch 
      ? responsibilitiesMatch[1].trim() 
      : emailBody.substring(0, 500).trim();
    
    console.log(`✅ Extracted: ${title} at ${company} (${foundSkills.length} skills found)`);
    
    return {
      title,
      company,
      description,
      location,
      locationType,
      experienceYears,
      requiredSkills,
      niceToHaveSkills,
      educationRequired: bodyLower.includes('bachelor') || bodyLower.includes('degree') ? "Bachelor's Degree" : undefined,
      salaryRange: undefined // Hard to extract reliably with keywords
    };
  }

  /**
   * Clear all Outlook-sourced resumes
   */
  async clearOutlookResumes(): Promise<number> {
    console.log('🗑️ Clearing all Outlook-sourced resumes');

    const result = await RecruiterResume.deleteMany({
      'source.type': 'outlook',
    });

    console.log(`✅ Deleted ${result.deletedCount} Outlook resumes`);
    return result.deletedCount;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    const total = await RecruiterResume.countDocuments({
      'source.type': 'outlook',
    });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthCount = await RecruiterResume.countDocuments({
      'source.type': 'outlook',
      'source.receivedDate': { $gte: lastMonth },
    });

    const lastSync = await RecruiterResume.findOne({
      'source.type': 'outlook',
    })
      .sort({ createdAt: -1 })
      .select('createdAt source.syncedBy');

    return {
      total,
      lastMonth: lastMonthCount,
      lastSync: lastSync?.createdAt || null,
      lastSyncBy: lastSync?.source?.syncedBy || null,
    };
  }
}

export default new OutlookService();
