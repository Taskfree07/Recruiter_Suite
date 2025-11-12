import axios from 'axios';
import crypto from 'crypto';
import ILabor360Config from '../models/iLabor360Config';
import ILabor360SyncLog from '../models/iLabor360SyncLog';
import UnifiedJob from '../models/unifiedJob';
import RecruiterResume from '../models/recruiterResume';

/**
 * iLabor360 Service
 *
 * This service handles integration with iLabor360 through web scraping.
 * It manages authentication, syncing requisitions and submissions,
 * and maintains sync logs.
 */
class ILabor360Service {
  private scraperUrl: string;
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor() {
    this.scraperUrl = process.env.ILABOR360_SCRAPER_URL || 'http://localhost:5002';
    
    // Generate or use encryption key
    const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key.slice(0, 64), 'hex');
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as crypto.CipherGCM;
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encrypted: string): string {
    try {
      if (!encrypted) {
        throw new Error('No encrypted data provided');
      }

      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error: any) {
      console.error('Decryption error:', error.message);
      throw new Error('Failed to decrypt password. Please update your password in settings.');
    }
  }

  /**
   * Get or create configuration
   */
  async getOrCreateConfig(userId: string = 'default-user'): Promise<any> {
    let config = await ILabor360Config.findOne({ userId });

    if (!config) {
      config = new ILabor360Config({
        userId,
        username: '',
        password: '',
        connectionStatus: 'disconnected',
        syncEnabled: false,
        autoSync: false
      });
      await config.save();
    }

    return config;
  }

  /**
   * Update configuration
   */
  async updateConfig(userId: string, updates: any): Promise<any> {
    const config = await this.getOrCreateConfig(userId);

    // Encrypt password if provided and not already encrypted
    if (updates.password) {
      // Check if password is already encrypted (contains colons from IV:TAG:ENCRYPTED format)
      if (!updates.password.includes(':') || updates.password === '********') {
        updates.password = this.encrypt(updates.password);
      }
    }

    Object.assign(config, updates);
    await config.save();

    return config;
  }

  /**
   * Test connection to iLabor360
   */
  async testConnection(userId: string = 'default-user'): Promise<any> {
    try {
      const config = await ILabor360Config.findOne({ userId });

      if (!config) {
        throw new Error('iLabor360 not configured. Please set up your credentials first.');
      }

      if (!config.username || !config.password) {
        throw new Error('Username and password are required');
      }

      console.log('🔐 Testing iLabor360 connection...');

      // Decrypt password
      let decryptedPassword: string;
      try {
        decryptedPassword = this.decrypt(config.password);
      } catch (decryptError) {
        throw new Error('Invalid password encryption. Please update your password in settings.');
      }

      // Call scraper service to test login
      const response = await axios.post(
        `${this.scraperUrl}/scrape/login`,
        {
          username: config.username,
          password: decryptedPassword,
          loginUrl: config.loginUrl
        },
        { 
          timeout: 60000,
          validateStatus: function (status) {
            // Don't throw on any status, we'll handle it
            return status < 500;
          }
        }
      );

      if (response.data.success) {
        // Update config
        config.connectionStatus = 'connected';
        config.lastConnectionTest = new Date();
        config.lastError = undefined;
        await config.save();

        // Close session immediately after test
        if (response.data.sessionId) {
          await axios.post(`${this.scraperUrl}/session/close`, {
            sessionId: response.data.sessionId
          }).catch(() => {});
        }

        console.log('✅ Connection test successful');

        return {
          success: true,
          message: 'Successfully connected to iLabor360'
        };
      } else {
        // Login failed (401 or 400)
        const errorMsg = response.data.error || 'Login failed - please check your credentials';
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error.message);

      // Update config
      const config = await ILabor360Config.findOne({ userId });
      if (config) {
        config.connectionStatus = 'error';
        config.lastError = error.message;
        config.errorCount = (config.errorCount || 0) + 1;
        await config.save();
      }

      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
        errorMessage = 'Unable to connect to scraper service. Please ensure the iLabor360 scraper service is running.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. The iLabor360 website may be slow or unreachable.';
      } else if (error.message.includes('credentials') || error.message.includes('incorrect')) {
        errorMessage = 'Invalid credentials. Please check your username and password.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Sync requisitions and submissions from iLabor360
   */
  async syncAll(userId: string = 'default-user', syncType: 'manual' | 'auto' = 'manual'): Promise<any> {
    const startTime = Date.now();
    let sessionId: string | undefined;

    try {
      const config = await ILabor360Config.findOne({ userId });

      if (!config) {
        throw new Error('iLabor360 not configured');
      }

      if (!config.syncEnabled) {
        throw new Error('Sync is disabled. Please enable it in settings.');
      }

      console.log(`🔄 Starting iLabor360 ${syncType} sync...`);

      // Decrypt password
      let decryptedPassword: string;
      try {
        decryptedPassword = this.decrypt(config.password);
      } catch (decryptError) {
        throw new Error('Invalid password encryption. Please update your password in settings.');
      }

      // Step 1: Login
      console.log('🔐 Logging in to iLabor360...');
      const loginResponse = await axios.post(
        `${this.scraperUrl}/scrape/login`,
        {
          username: config.username,
          password: decryptedPassword,
          loginUrl: config.loginUrl
        },
        { timeout: 60000 }
      );

      if (!loginResponse.data.success) {
        throw new Error('Login failed: ' + loginResponse.data.error);
      }

      sessionId = loginResponse.data.sessionId;
      console.log('✅ Login successful');

      // Step 2: Scrape requisitions (jobs only)
      console.log('📥 Scraping requisitions from iLabor360...');
      const scrapeResponse = await axios.post(
        `${this.scraperUrl}/scrape/requisitions`,
        {
          sessionId,
          maxRequisitions: config.maxRequisitionsPerSync,
          status: 'all'
        },
        { 
          timeout: 300000,  // 5 minutes for manual login
          validateStatus: function (status) {
            return status < 500;
          }
        }
      );

      if (!scrapeResponse.data.success) {
        throw new Error(scrapeResponse.data.error || 'Scraping failed');
      }

      const requisitions = scrapeResponse.data.requisitions || [];

      console.log(`📊 Found ${requisitions.length} requisitions`);

      // Step 3: Process requisitions
      const reqResults = await this.processRequisitions(requisitions, userId);

      // Step 4: Update stats
      config.lastSyncDate = new Date();
      config.lastSyncRequisitionCount = requisitions.length;
      config.totalRequisitionsSynced += reqResults.added;
      await config.save();

      // Step 5: Log sync
      const durationMs = Date.now() - startTime;

      await ILabor360SyncLog.create({
        userId,
        syncType,
        syncStartTime: new Date(startTime),
        syncEndTime: new Date(),
        status: reqResults.errors.length > 0 ? 'partial' : 'success',
        requisitionsFound: requisitions.length,
        requisitionsAdded: reqResults.added,
        requisitionsUpdated: reqResults.updated,
        requisitionsSkipped: reqResults.skipped,
        submissionsFound: 0,
        submissionsAdded: 0,
        submissionsUpdated: 0,
        submissionsSkipped: 0,
        errors: reqResults.errors,
        durationMs,
        sessionId
      });

      console.log(`✅ Sync completed in ${(durationMs / 1000).toFixed(2)}s`);

      return {
        success: true,
        message: `Sync completed! Added ${reqResults.added}, updated ${reqResults.updated}, skipped ${reqResults.skipped} requisitions.`,
        requisitions: reqResults,
        durationMs
      };
    } catch (error: any) {
      console.error('❌ Sync failed:', error.message);

      // Log failed sync
      await ILabor360SyncLog.create({
        userId,
        syncType,
        syncStartTime: new Date(startTime),
        syncEndTime: new Date(),
        status: 'failed',
        requisitionsFound: 0,
        requisitionsAdded: 0,
        requisitionsUpdated: 0,
        requisitionsSkipped: 0,
        submissionsFound: 0,
        submissionsAdded: 0,
        submissionsUpdated: 0,
        submissionsSkipped: 0,
        errors: [{
          error: error.message,
          itemType: 'requisition',
          timestamp: new Date()
        }],
        durationMs: Date.now() - startTime,
        sessionId
      });

      throw error;
    } finally {
      // Always close session
      if (sessionId) {
        await axios.post(`${this.scraperUrl}/session/close`, {
          sessionId
        }).catch(() => {});
      }
    }
  }

  /**
   * Process and save requisitions as UnifiedJobs
   */
  private async processRequisitions(requisitions: any[], userId: string): Promise<any> {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const req of requisitions) {
      try {
        const sourceId = req.source?.id || `ILABOR360-${req.source?.metadata?.reqId}`;

        // Check if job already exists
        const existingJob = await UnifiedJob.findOne({
          'sources.type': 'ilabor360',
          'sources.id': sourceId
        });

        if (existingJob) {
          // Update existing job with ALL fields including new ones
          existingJob.title = req.title || existingJob.title;
          existingJob.description = req.description || existingJob.description;
          existingJob.company = req.company || existingJob.company;
          existingJob.requiredSkills = req.requiredSkills || existingJob.requiredSkills;
          existingJob.experienceYears = req.experienceYears || existingJob.experienceYears;
          existingJob.experienceLevel = req.experienceLevel || existingJob.experienceLevel;
          existingJob.location = req.location || existingJob.location;
          existingJob.locationType = req.locationType || existingJob.locationType;
          existingJob.status = req.status || existingJob.status;
          existingJob.positions = req.positions || existingJob.positions;
          existingJob.department = req.department || existingJob.department;
          existingJob.recruiterAssigned = req.recruiterAssigned || existingJob.recruiterAssigned;
          existingJob.closingDate = req.closingDate || existingJob.closingDate;

          // Update source metadata with ALL scraped fields
          const sourceIndex = existingJob.sources.findIndex(
            (s: any) => s.type === 'ilabor360' && s.id === sourceId
          );
          if (sourceIndex >= 0) {
            existingJob.sources[sourceIndex].syncDate = new Date();
            existingJob.sources[sourceIndex].metadata = req.source?.metadata || existingJob.sources[sourceIndex].metadata;
          }

          await existingJob.save();
          updated++;
        } else {
          // Create new job with ALL available fields
          const newJob = new UnifiedJob({
            title: req.title,
            description: req.description,
            company: req.company,
            requiredSkills: req.requiredSkills || [],
            niceToHaveSkills: req.niceToHaveSkills || [],
            experienceYears: req.experienceYears || { min: 0, max: 10 },
            experienceLevel: req.experienceLevel || 'Mid',
            location: req.location || 'Remote',
            locationType: req.locationType || 'remote',
            status: req.status || 'open',
            postedDate: req.postedDate || new Date(),
            closingDate: req.closingDate,
            positions: req.positions || 1,
            department: req.department,
            recruiterAssigned: req.recruiterAssigned,
            sources: [
              {
                type: 'ilabor360',
                id: sourceId,
                url: req.source?.url || '',
                metadata: req.source?.metadata || {},
                syncDate: new Date()
              }
            ],
            source: 'ilabor360',
            priority: 'medium'
          });

          await newJob.save();
          added++;
        }
      } catch (error: any) {
        console.error(`Error processing requisition ${req.source?.metadata?.reqId}:`, error.message);
        errors.push({
          itemId: req.source?.metadata?.reqId,
          itemType: 'requisition',
          error: error.message,
          timestamp: new Date()
        });
        skipped++;
      }
    }

    return { added, updated, skipped, errors };
  }

  /**
   * Process and link submissions to UnifiedJobs
   */
  private async processSubmissions(submissions: any[], userId: string): Promise<any> {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const sub of submissions) {
      try {
        const reqId = `ILABOR360-${sub.reqId}`;

        // Find corresponding job
        const job = await UnifiedJob.findOne({
          'sources.type': 'ilabor360',
          'sources.id': reqId
        });

        if (!job) {
          console.warn(`No job found for submission ${sub.submissionId} (reqId: ${reqId})`);
          skipped++;
          continue;
        }

        // Check if candidate exists in our system
        let candidate = await RecruiterResume.findOne({
          name: { $regex: new RegExp(sub.candidateName, 'i') }
        });

        // Initialize submissions array if it doesn't exist
        if (!job.submissions) {
          job.submissions = [];
        }

        // Check if submission already exists
        const existingSubmission = job.submissions.find(
          (s: any) => s.candidateName === sub.candidateName
        );

        if (existingSubmission) {
          // Update existing submission
          existingSubmission.status = sub.status;
          existingSubmission.notes = sub.notes;
          updated++;
        } else {
          // Add new submission
          job.submissions.push({
            candidateId: candidate?._id,
            candidateName: sub.candidateName,
            submittedAt: sub.submittedAt || new Date(),
            status: sub.status,
            matchScore: 0, // Will be calculated by matching service
            notes: sub.notes
          } as any);
          added++;
        }

        job.applicationsCount = job.submissions.length;
        await job.save();

      } catch (error: any) {
        console.error(`Error processing submission ${sub.submissionId}:`, error.message);
        errors.push({
          itemId: sub.submissionId,
          itemType: 'submission',
          error: error.message,
          timestamp: new Date()
        });
        skipped++;
      }
    }

    return { added, updated, skipped, errors };
  }

  /**
   * Get sync statistics
   */
  async getStats(userId: string = 'default-user'): Promise<any> {
    const config = await ILabor360Config.findOne({ userId });
    
    if (!config) {
      return {
        totalRequisitionsSynced: 0,
        totalSubmissionsSynced: 0,
        lastSyncDate: null,
        recentSyncs: []
      };
    }

    // Get recent sync logs
    const recentSyncs = await ILabor360SyncLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      totalRequisitionsSynced: config.totalRequisitionsSynced,
      totalSubmissionsSynced: config.totalSubmissionsSynced,
      lastSyncDate: config.lastSyncDate,
      lastSyncRequisitionCount: config.lastSyncRequisitionCount,
      lastSyncSubmissionCount: config.lastSyncSubmissionCount,
      errorCount: config.errorCount,
      recentSyncs: recentSyncs.map((log: any) => ({
        date: log.createdAt,
        status: log.status,
        requisitionsAdded: log.requisitionsAdded,
        submissionsAdded: log.submissionsAdded,
        duration: log.durationMs,
        errors: log.syncErrors?.length || 0
      }))
    };
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(userId: string = 'default-user', limit: number = 20): Promise<any> {
    const logs = await ILabor360SyncLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return logs;
  }
}

export default new ILabor360Service();
