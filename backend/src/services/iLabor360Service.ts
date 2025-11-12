import axios from 'axios';
import crypto from 'crypto';
import ILabor360Config from '../models/iLabor360Config';
import ILabor360SyncLog from '../models/iLabor360SyncLog';
import UnifiedJob from '../models/unifiedJob';

/**
 * iLabor360 Service - REST API v2.0
 *
 * This service handles integration with iLabor360 REST API v2.0.
 * It uses tokenization for authentication and retrieves released requisitions.
 *
 * API Documentation:
 * - Base URL: https://api.ilabor360.com/v2/rest/
 * - Token validity: 15 minutes
 * - Date range limit: 1-3 days (recommended: 1 day)
 * - Only Released Requisitions can be retrieved
 */
class ILabor360Service {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor() {
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
      throw new Error('Failed to decrypt credentials. Please update your credentials in settings.');
    }
  }

  /**
   * Check if cached token is still valid (within 15 minutes)
   */
  private isTokenValid(config: any): boolean {
    if (!config.lastApiToken || !config.lastTokenTime) {
      return false;
    }

    const tokenAge = Date.now() - new Date(config.lastTokenTime).getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    // Consider token valid if less than 14 minutes old (1 min buffer)
    return tokenAge < (fifteenMinutes - 60000);
  }

  /**
   * Get API token (login)
   * POST /login?userName={{api.user}}&key={{api.key}}&password={{api.pass}}
   */
  private async getApiToken(config: any): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (this.isTokenValid(config)) {
        console.log('✅ Using cached API token');
        return config.lastApiToken;
      }

      console.log('🔐 Requesting new API token...');

      // Decrypt credentials
      const apiKey = this.decrypt(config.apiKey);
      const apiPassword = this.decrypt(config.apiPassword);

      const loginUrl = `${config.apiBaseUrl}/login`;
      const params = {
        userName: config.apiUsername,
        key: apiKey,
        password: apiPassword
      };

      const response = await axios.post(loginUrl, null, {
        params,
        timeout: 30000,
        validateStatus: (status) => status < 500
      });

      if (response.data.status === 'success' && response.data.result) {
        const token = response.data.result;

        // Cache the token
        config.lastApiToken = token;
        config.lastTokenTime = new Date();
        await config.save();

        console.log('✅ API token obtained successfully');
        return token;
      } else if (response.data.status === 'error') {
        const errorMsg = response.data.error?.message || 'Authentication failed';
        throw new Error(`API Login Failed: ${errorMsg}`);
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error: any) {
      if (error.message.includes('API Login Failed')) {
        throw error;
      }
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
        throw new Error('Unable to connect to iLabor360 API. Please check your network connection.');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('API request timeout. The iLabor360 API may be slow or unreachable.');
      }

      throw new Error(`API Authentication Error: ${error.message}`);
    }
  }

  /**
   * Fetch requisitions from API
   * GET /ReqProv?apiToken={{token}}&userName={{user}}&sysUserID={{sysUser}}&StartDate=...&EndDate=...
   */
  private async fetchRequisitions(
    apiToken: string,
    config: any,
    startDate: string,
    endDate: string,
    useModifiedDate: boolean = false
  ): Promise<any[]> {
    try {
      console.log(`📥 Fetching requisitions from ${startDate} to ${endDate}...`);

      const reqProvUrl = `${config.apiBaseUrl}/ReqProv`;
      
      const params: any = {
        apiToken,
        userName: config.apiUsername,
        sysUserID: config.sysUserId
      };

      // Use modified date or regular date based on config
      if (useModifiedDate) {
        params.modifyStartDate = startDate;
        params.modifyEndDate = endDate;
      } else {
        params.StartDate = startDate;
        params.EndDate = endDate;
      }

      const response = await axios.get(reqProvUrl, {
        params,
        timeout: 60000,
        validateStatus: (status) => status < 500
      });

      if (response.data.status === 'success' && Array.isArray(response.data.result)) {
        const requisitions = response.data.result;
        console.log(`✅ Retrieved ${requisitions.length} requisitions`);
        return requisitions;
      } else if (response.data.status === 'error') {
        const errorMsg = response.data.error?.message || 'Failed to fetch requisitions';
        throw new Error(`API Error: ${errorMsg}`);
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error: any) {
      if (error.message.includes('API Error')) {
        throw error;
      }

      if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
        throw new Error('Unable to connect to iLabor360 API. Please check your network connection.');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('API request timeout. The iLabor360 API may be slow or unreachable.');
      }

      throw new Error(`Failed to fetch requisitions: ${error.message}`);
    }
  }

  /**
   * Format date for API (MM/DD/YYYY)
   */
  private formatDateForAPI(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Get or create configuration
   */
  async getOrCreateConfig(userId: string = 'default-user'): Promise<any> {
    let config = await ILabor360Config.findOne({ userId });

    if (!config) {
      config = new ILabor360Config({
        userId,
        apiUsername: '',
        apiKey: '',
        apiPassword: '',
        sysUserId: '',
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

    // Encrypt sensitive fields if provided and not already encrypted
    if (updates.apiKey && !updates.apiKey.includes(':')) {
      updates.apiKey = this.encrypt(updates.apiKey);
    }

    if (updates.apiPassword && updates.apiPassword !== '********' && !updates.apiPassword.includes(':')) {
      updates.apiPassword = this.encrypt(updates.apiPassword);
    }

    Object.assign(config, updates);
    
    // Clear cached token when credentials change
    if (updates.apiUsername || updates.apiKey || updates.apiPassword) {
      config.lastApiToken = undefined;
      config.lastTokenTime = undefined;
    }

    await config.save();

    return config;
  }

  /**
   * Test connection to iLabor360 API
   */
  async testConnection(userId: string = 'default-user'): Promise<any> {
    try {
      const config = await ILabor360Config.findOne({ userId });

      if (!config) {
        throw new Error('iLabor360 not configured. Please set up your credentials first.');
      }

      if (!config.apiUsername || !config.apiKey || !config.apiPassword || !config.sysUserId) {
        throw new Error('All API credentials are required: API Username, API Key, API Password, and System User ID');
      }

      console.log('🔐 Testing iLabor360 API connection...');

      // Try to get a token (this tests authentication)
      const token = await this.getApiToken(config);

      if (token) {
        // Update config
        config.connectionStatus = 'connected';
        config.lastConnectionTest = new Date();
        config.lastError = undefined;
        await config.save();

        console.log('✅ Connection test successful');

        return {
          success: true,
          message: 'Successfully connected to iLabor360 API'
        };
      } else {
        throw new Error('Failed to obtain API token');
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

      throw error;
    }
  }

  /**
   * Sync requisitions from iLabor360 API
   */
  async syncAll(userId: string = 'default-user', syncType: 'manual' | 'auto' = 'manual'): Promise<any> {
    const startTime = Date.now();

    try {
      const config = await ILabor360Config.findOne({ userId });

      if (!config) {
        throw new Error('iLabor360 not configured');
      }

      if (!config.syncEnabled) {
        throw new Error('Sync is disabled. Please enable it in settings.');
      }

      if (!config.apiUsername || !config.apiKey || !config.apiPassword || !config.sysUserId) {
        throw new Error('All API credentials are required');
      }

      console.log(`🔄 Starting iLabor360 ${syncType} sync...`);

      // Step 1: Get API Token
      const apiToken = await this.getApiToken(config);

      // Step 2: Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - config.syncDateRange);

      const startDateStr = this.formatDateForAPI(startDate);
      const endDateStr = this.formatDateForAPI(endDate);

      // Step 3: Fetch requisitions
      const requisitions = await this.fetchRequisitions(
        apiToken,
        config,
        startDateStr,
        endDateStr,
        config.useModifiedDate
      );

      // Step 4: Process requisitions
      const reqResults = await this.processRequisitions(requisitions, userId);

      // Step 5: Update stats
      config.lastSyncDate = new Date();
      config.lastSyncRequisitionCount = requisitions.length;
      config.totalRequisitionsSynced += reqResults.added;
      await config.save();

      // Step 6: Log sync
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
        durationMs
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
        durationMs: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Process and save requisitions as UnifiedJobs
   * Maps iLabor360 API v2.0 requisition structure to UnifiedJob model
   */
  private async processRequisitions(requisitions: any[], userId: string): Promise<any> {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const req of requisitions) {
      try {
        const sourceId = `ILABOR360-${req.requisition_id}`;

        // Check if job already exists
        const existingJob = await UnifiedJob.findOne({
          'sources.type': 'ilabor360',
          'sources.id': sourceId
        });

        // Map API fields to UnifiedJob structure
        const jobData = {
          title: req.job_title_code || req.position_type_name || 'Untitled Position',
          description: req.job_description || '',
          company: req.customer_name || req.client_name || '',
          requiredSkills: this.extractSkills(req),
          experienceYears: { min: 0, max: 10 }, // API doesn't provide this
          experienceLevel: 'Mid' as const,
          location: this.formatLocation(req.location),
          locationType: this.determineLocationType(req),
          status: this.mapStatus(req.status_name),
          postedDate: req.req_release_date ? new Date(req.req_release_date) : new Date(),
          closingDate: req.projected_end_date ? new Date(req.projected_end_date) : undefined,
          positions: req.no_of_positions || 1,
          department: req.department_name || '',
          recruiterAssigned: req.req_owner || '',
          sources: [
            {
              type: 'ilabor360' as const,
              id: sourceId,
              url: '',
              metadata: {
                requisition_id: req.requisition_id,
                requisition_no: req.requisition_no,
                projected_start_date: req.projected_start_date,
                projected_end_date: req.projected_end_date,
                bill_rate_low: req.bill_rate_low,
                ot_rate: req.ot_rate,
                report_to: req.report_to,
                phone: req.phone,
                background_check: req.background_check,
                drug_screen: req.drug_screen,
                can_submit_candidate: req.can_submit_candidate,
                customer_ref_no: req.customer_ref_no,
                primary_skill_set: req.primary_skill_set,
                secondary_skill_set: req.secondary_skill_set,
                other_skill_set: req.other_skill_set,
                notes: req.notes,
                alternate_email: req.alternate_email,
                stage: req.stage,
                secondary_rate: req.secondary_rate,
                remaining_positions: req.remaining_positions,
                account_manager: req.account_manager,
                requisition_type_name: req.requisition_type_name,
                category_name: req.category_name,
                job_shift_code: req.job_shift_code,
                project_name: req.project_name,
                req_owner_email: req.req_owner_email,
                supplement_fields: req.supplement_fields
              },
              syncDate: new Date()
            }
          ],
          source: 'ilabor360' as const,
          priority: 'medium' as const
        };

        if (existingJob) {
          // Update existing job
          Object.assign(existingJob, jobData);

          // Update source metadata
          const sourceIndex = existingJob.sources.findIndex(
            (s: any) => s.type === 'ilabor360' && s.id === sourceId
          );
          if (sourceIndex >= 0) {
            existingJob.sources[sourceIndex] = jobData.sources[0];
          }

          await existingJob.save();
          updated++;
        } else {
          // Create new job
          const newJob = new UnifiedJob(jobData);
          await newJob.save();
          added++;
        }
      } catch (error: any) {
        console.error(`Error processing requisition ${req.requisition_id}:`, error.message);
        errors.push({
          itemId: req.requisition_id,
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
   * Extract skills from requisition
   */
  private extractSkills(req: any): string[] {
    const skills: string[] = [];

    if (req.primary_skill_set) {
      skills.push(...req.primary_skill_set.split(',').map((s: string) => s.trim()).filter(Boolean));
    }

    if (req.secondary_skill_set) {
      skills.push(...req.secondary_skill_set.split(',').map((s: string) => s.trim()).filter(Boolean));
    }

    if (req.other_skill_set) {
      skills.push(...req.other_skill_set.split(',').map((s: string) => s.trim()).filter(Boolean));
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Format location from API location object
   */
  private formatLocation(location: any): string {
    if (!location) return 'Remote';

    const parts: string[] = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    return parts.length > 0 ? parts.join(', ') : 'Remote';
  }

  /**
   * Determine location type
   */
  private determineLocationType(req: any): 'remote' | 'onsite' | 'hybrid' {
    const location = req.location;
    if (!location || !location.city) {
      return 'remote';
    }
    // Default to onsite if location is specified
    return 'onsite';
  }

  /**
   * Map status from API to UnifiedJob status
   */
  private mapStatus(statusName: string | undefined): 'open' | 'closed' | 'on-hold' {
    if (!statusName) return 'open';

    const status = statusName.toLowerCase();
    if (status.includes('closed') || status.includes('filled') || status.includes('cancelled')) {
      return 'closed';
    }
    if (status.includes('hold') || status.includes('pending')) {
      return 'on-hold';
    }
    return 'open';
  }

  /**
   * Get sync statistics
   */
  async getStats(userId: string = 'default-user'): Promise<any> {
    const config = await ILabor360Config.findOne({ userId });
    
    if (!config) {
      return {
        totalRequisitionsSynced: 0,
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
      lastSyncDate: config.lastSyncDate,
      lastSyncRequisitionCount: config.lastSyncRequisitionCount,
      errorCount: config.errorCount,
      recentSyncs: recentSyncs.map((log: any) => ({
        date: log.createdAt,
        status: log.status,
        requisitionsAdded: log.requisitionsAdded,
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
