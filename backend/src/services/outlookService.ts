import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import RecruiterResume from '../models/recruiterResume';
import recruiterParserService from './recruiterParserService';
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
          // Get attachments for this message
          const attachmentsResponse = await client
            .api(`/me/messages/${message.id}/attachments`)
            .select('id,name,contentType,size,contentBytes')
            .get();

          const attachments = attachmentsResponse.value;

          // Filter for resume files (PDF, DOCX, DOC)
          const resumeAttachments = attachments.filter((att: any) => {
            const ext = path.extname(att.name).toLowerCase();
            const isResumeFile = ['.pdf', '.docx', '.doc'].includes(ext);
            const isSizeOk = att.size < 10 * 1024 * 1024; // Max 10MB

            // Check if filename or subject suggests it's a resume
            const nameHasResume = att.name.toLowerCase().match(/resume|cv|curriculum/);
            const subjectHasResume = message.subject?.toLowerCase().match(/resume|cv|application|candidate/);

            return isResumeFile && isSizeOk && (nameHasResume || subjectHasResume);
          });

          if (resumeAttachments.length === 0) {
            continue;
          }

          console.log(`📎 Processing ${resumeAttachments.length} resume(s) from: ${message.from.emailAddress.address} - "${message.subject}"`);

          // Process each attachment
          for (const attachment of resumeAttachments) {
            try {
              const resume = await this.processResumeAttachment(
                attachment,
                message,
                options.userEmail
              );
              processedResumes.push(resume);
              console.log(`✅ Processed: ${attachment.name}`);
            } catch (error) {
              const errorMsg = `Failed to process ${attachment.name}: ${(error as Error).message}`;
              console.error(`❌ ${errorMsg}`);
              errors.push(errorMsg);
            }
          }
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
