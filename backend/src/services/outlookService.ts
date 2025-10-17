import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import OutlookConfig from '../models/outlookConfig';
import aiService from './aiService';
import emailService from './emailService';
import 'isomorphic-fetch';
import path from 'path';
import fs from 'fs';

interface EmailMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  hasAttachments: boolean;
}

interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
}

class OutlookService {
  private msalClient: ConfidentialClientApplication | null = null;
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID || '';
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';
    this.tenantId = process.env.OUTLOOK_TENANT_ID || 'common';
    this.redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:5000/api/outlook/callback';

    if (this.clientId && this.clientSecret) {
      this.initializeMsal();
    } else {
      console.warn('⚠️ Outlook OAuth credentials not configured in .env');
    }
  }

  private initializeMsal() {
    try {
      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          authority: `https://login.microsoftonline.com/${this.tenantId}`,
        },
      });
      console.log('✅ Microsoft MSAL client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MSAL client:', error);
    }
  }

  /**
   * Get OAuth authorization URL for user to login
   */
  getAuthUrl(): string {
    if (!this.msalClient) {
      throw new Error('Outlook OAuth not configured. Please set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in .env');
    }

    const scopes = [
      'offline_access',
      'Mail.Read',
      'Mail.ReadWrite',
      'User.Read'
    ];

    const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scopes.join(' '))}`;

    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresOn: Date;
    emailAddress: string;
  }> {
    if (!this.msalClient) {
      throw new Error('MSAL client not initialized');
    }

    try {
      const tokenResponse = await this.msalClient.acquireTokenByCode({
        code,
        scopes: ['Mail.Read', 'Mail.ReadWrite', 'User.Read', 'offline_access'],
        redirectUri: this.redirectUri,
      });

      if (!tokenResponse.accessToken || !tokenResponse.account) {
        throw new Error('Failed to acquire token');
      }

      // Get user profile to get email address
      const client = this.createGraphClient(tokenResponse.accessToken);
      const user = await client.api('/me').get();

      // Note: MSAL handles refresh tokens automatically via token cache
      // We'll store a placeholder and rely on MSAL's token cache
      return {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.account?.homeAccountId || 'msal-cache',
        expiresOn: tokenResponse.expiresOn || new Date(Date.now() + 3600000),
        emailAddress: user.mail || user.userPrincipalName || tokenResponse.account.username,
      };
    } catch (error: any) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Refresh access token using MSAL token cache
   * Note: MSAL v2+ manages refresh tokens automatically via cache
   */
  async refreshAccessToken(accountId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresOn: Date;
  }> {
    if (!this.msalClient) {
      throw new Error('MSAL client not initialized');
    }

    try {
      // Try silent token acquisition using MSAL cache
      const tokenResponse = await this.msalClient.acquireTokenSilent({
        scopes: ['Mail.Read', 'Mail.ReadWrite', 'User.Read', 'offline_access'],
        account: accountId as any, // Account identifier
      });

      if (!tokenResponse.accessToken) {
        throw new Error('Failed to refresh token');
      }

      return {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.account?.homeAccountId || accountId,
        expiresOn: tokenResponse.expiresOn || new Date(Date.now() + 3600000),
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Create Microsoft Graph API client
   */
  private createGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getValidAccessToken(config: any): Promise<string> {
    const now = new Date();
    const expiry = new Date(config.tokenExpiry);

    // Refresh token if it expires in less than 5 minutes
    if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log('🔄 Access token expired, refreshing...');
      const refreshed = await this.refreshAccessToken(config.refreshToken);

      // Update config with new tokens
      config.accessToken = refreshed.accessToken;
      config.refreshToken = refreshed.refreshToken;
      config.tokenExpiry = refreshed.expiresOn;
      await config.save();

      console.log('✅ Access token refreshed');
      return refreshed.accessToken;
    }

    return config.accessToken;
  }

  /**
   * Fetch emails from Outlook
   */
  async fetchEmails(
    accessToken: string,
    options?: {
      folder?: string;
      hasAttachments?: boolean;
      receivedAfter?: Date;
      maxResults?: number;
    }
  ): Promise<EmailMessage[]> {
    const client = this.createGraphClient(accessToken);

    try {
      let endpoint = '/me/messages';
      const filterClauses: string[] = [];

      // Build filter query
      if (options?.hasAttachments) {
        filterClauses.push('hasAttachments eq true');
      }

      if (options?.receivedAfter) {
        const dateStr = options.receivedAfter.toISOString();
        filterClauses.push(`receivedDateTime ge ${dateStr}`);
      }

      const queryParams: any = {
        $top: options?.maxResults || 50,
        $orderby: 'receivedDateTime DESC',
        $select: 'id,subject,from,receivedDateTime,bodyPreview,body,hasAttachments',
      };

      if (filterClauses.length > 0) {
        queryParams.$filter = filterClauses.join(' and ');
      }

      const response = await client
        .api(endpoint)
        .query(queryParams)
        .get();

      return response.value as EmailMessage[];
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  }

  /**
   * Get email attachments
   */
  async getEmailAttachments(
    accessToken: string,
    messageId: string
  ): Promise<EmailAttachment[]> {
    const client = this.createGraphClient(accessToken);

    try {
      const response = await client
        .api(`/me/messages/${messageId}/attachments`)
        .get();

      return response.value as EmailAttachment[];
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      throw new Error(`Failed to fetch attachments: ${error.message}`);
    }
  }

  /**
   * Download attachment
   */
  async downloadAttachment(
    accessToken: string,
    messageId: string,
    attachmentId: string
  ): Promise<Buffer> {
    const client = this.createGraphClient(accessToken);

    try {
      const attachment = await client
        .api(`/me/messages/${messageId}/attachments/${attachmentId}`)
        .get();

      if (attachment.contentBytes) {
        return Buffer.from(attachment.contentBytes, 'base64');
      }

      throw new Error('Attachment content not available');
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      throw new Error(`Failed to download attachment: ${error.message}`);
    }
  }

  /**
   * Mark email as read
   */
  async markEmailAsRead(accessToken: string, messageId: string): Promise<void> {
    const client = this.createGraphClient(accessToken);

    try {
      await client
        .api(`/me/messages/${messageId}`)
        .update({ isRead: true });
    } catch (error: any) {
      console.error('Error marking email as read:', error);
    }
  }

  /**
   * Classify email type (job description or resume)
   */
  private async classifyEmail(email: EmailMessage): Promise<'job' | 'resume' | 'other'> {
    const subject = email.subject.toLowerCase();
    const bodyPreview = email.bodyPreview.toLowerCase();
    const content = `${subject} ${bodyPreview}`;

    // Job description keywords
    const jobKeywords = ['job opening', 'position', 'hiring', 'vacancy', 'job description', 'jd', 'requirement'];
    const jobCount = jobKeywords.filter(k => content.includes(k)).length;

    // Resume keywords
    const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'application'];
    const resumeCount = resumeKeywords.filter(k => content.includes(k)).length;

    if (jobCount > resumeCount && jobCount > 0) {
      return 'job';
    } else if (resumeCount > 0 && email.hasAttachments) {
      return 'resume';
    }

    return 'other';
  }

  /**
   * Process job description email
   */
  async processJobEmail(email: EmailMessage, accessToken: string): Promise<any> {
    try {
      console.log(`📧 Processing job email: ${email.subject}`);

      // Get full email body
      const emailContent = `
Subject: ${email.subject}
From: ${email.from.emailAddress.address}
Date: ${email.receivedDateTime}

${email.body.content}
      `.trim();

      // Parse job description using AI
      const jobDescription = await aiService.parseJobDescriptionFromEmail(emailContent);

      if (!jobDescription) {
        console.log('⚠️ Could not extract job description from email');
        return null;
      }

      // Add source metadata
      const job = {
        ...jobDescription,
        source: {
          type: 'outlook',
          emailId: email.id,
          emailSubject: email.subject,
          senderEmail: email.from.emailAddress.address,
          receivedDate: new Date(email.receivedDateTime),
        },
      };

      console.log(`✅ Extracted job: ${job.title} at ${job.company}`);
      return job;
    } catch (error: any) {
      console.error('Error processing job email:', error);
      return null;
    }
  }

  /**
   * Process resume email with attachments
   */
  async processResumeEmail(email: EmailMessage, accessToken: string): Promise<any[]> {
    const processedResumes: any[] = [];

    try {
      console.log(`📎 Processing resume email: ${email.subject}`);

      // Get attachments
      const attachments = await this.getEmailAttachments(accessToken, email.id);

      // Filter for resume files
      const resumeAttachments = attachments.filter(att => {
        const ext = path.extname(att.name).toLowerCase();
        return ['.pdf', '.doc', '.docx'].includes(ext);
      });

      console.log(`Found ${resumeAttachments.length} resume attachment(s)`);

      // Process each resume
      for (const attachment of resumeAttachments) {
        try {
          // Download attachment
          const buffer = await this.downloadAttachment(accessToken, email.id, attachment.id);

          // Save to temp file
          const uploadDir = path.join(__dirname, '../../uploads/candidate-resumes');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const tempPath = path.join(uploadDir, `${Date.now()}_${attachment.name}`);
          fs.writeFileSync(tempPath, buffer);

          // Process using email service
          const resume = await emailService.processResumeFile(tempPath, attachment.name, {
            type: 'outlook',
            receivedDate: new Date(email.receivedDateTime),
          });

          // Add email source metadata
          resume.source.email = email.from.emailAddress.address;
          resume.source.emailSubject = email.subject;
          resume.source.emailId = email.id;

          await resume.save();
          processedResumes.push(resume);

          console.log(`✅ Processed resume: ${attachment.name}`);
        } catch (error: any) {
          console.error(`❌ Error processing attachment ${attachment.name}:`, error.message);
        }
      }

      return processedResumes;
    } catch (error: any) {
      console.error('Error processing resume email:', error);
      return processedResumes;
    }
  }

  /**
   * Main sync function - fetch and process emails
   */
  async syncEmails(userId: string = 'default-user'): Promise<{
    jobsProcessed: number;
    resumesProcessed: number;
    errors: string[];
  }> {
    const result = {
      jobsProcessed: 0,
      resumesProcessed: 0,
      errors: [] as string[],
    };

    try {
      // Get config
      const config = await OutlookConfig.findOne({ userId });

      if (!config || config.connectionStatus !== 'connected') {
        throw new Error('Outlook not connected. Please connect your account first.');
      }

      console.log('🔄 Starting Outlook email sync...');

      // Get valid access token
      const accessToken = await this.getValidAccessToken(config);

      // Fetch emails since last sync
      const lastSync = config.lastSyncDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const emails = await this.fetchEmails(accessToken, {
        receivedAfter: lastSync,
        maxResults: 50,
      });

      console.log(`📬 Found ${emails.length} new email(s) since ${lastSync.toLocaleString()}`);

      // Process each email
      for (const email of emails) {
        try {
          const type = await this.classifyEmail(email);

          if (type === 'job') {
            const job = await this.processJobEmail(email, accessToken);
            if (job) {
              result.jobsProcessed++;
              // TODO: Save to unified_jobs collection when implemented
            }
          } else if (type === 'resume') {
            const resumes = await this.processResumeEmail(email, accessToken);
            result.resumesProcessed += resumes.length;
          }

          // Mark as read (optional)
          // await this.markEmailAsRead(accessToken, email.id);
        } catch (error: any) {
          console.error(`Error processing email ${email.id}:`, error.message);
          result.errors.push(`Email "${email.subject}": ${error.message}`);
        }
      }

      // Update last sync date
      config.lastSyncDate = new Date();
      config.connectionStatus = 'connected';
      config.lastError = undefined;
      await config.save();

      console.log(`✅ Sync complete: ${result.jobsProcessed} jobs, ${result.resumesProcessed} resumes`);

      return result;
    } catch (error: any) {
      console.error('Sync error:', error);
      result.errors.push(error.message);

      // Update config error status
      try {
        const config = await OutlookConfig.findOne({ userId });
        if (config) {
          config.connectionStatus = 'error';
          config.lastError = error.message;
          await config.save();
        }
      } catch (e) {
        // Ignore
      }

      return result;
    }
  }

  /**
   * Test connection
   */
  async testConnection(accessToken: string): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      const client = this.createGraphClient(accessToken);
      const user = await client.api('/me').get();

      return {
        success: true,
        email: user.mail || user.userPrincipalName,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Disconnect Outlook account
   */
  async disconnect(userId: string = 'default-user'): Promise<void> {
    await OutlookConfig.findOneAndDelete({ userId });
    console.log('✅ Outlook account disconnected');
  }
}

export default new OutlookService();
