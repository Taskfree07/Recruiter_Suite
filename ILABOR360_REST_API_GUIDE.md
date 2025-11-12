# iLabor360 REST API v2.0 Integration Guide

## Overview

This application now uses **iLabor360 REST API v2.0** for job synchronization. The API uses **tokenization** for authentication and allows retrieval of released requisitions.

### Key Changes from Web Scraping

| Feature | Old (Web Scraping) | New (REST API v2.0) |
|---------|-------------------|---------------------|
| **Authentication** | Browser login | Token-based (15 min validity) |
| **Speed** | Slow (browser automation) | Fast (direct API calls) |
| **Reliability** | Breaks on UI changes | Stable API contract |
| **Data Access** | All pages | Released requisitions only |

---

## 🔑 Required Credentials

You need **FOUR** credentials from your iLabor360 account manager:

1. **API Username** (`userName`) - Your API user account
2. **API Key** (`key`) - Your unique API key
3. **API Password** (`password`) - API-specific password (NOT your portal password)
4. **System User ID** (`sysUserID`) - Your user ID in the system

**Important:** These are different from your vendor portal login credentials!

---

## 📦 Setup Instructions

### Step 1: Get Your API Credentials

Contact your iLabor360 account manager and request:
- REST API v2.0 access
- API Username, API Key, API Password, and System User ID

### Step 2: Configure the Application

#### Option A: Using the Setup Script (Recommended)

1. Open `backend/setup-ilabor-api.js`
2. Replace the placeholder values on lines 32-35:

```javascript
const credentials = {
  apiUsername: 'YOUR_ACTUAL_USERNAME',     // Your API username
  apiKey: 'YOUR_ACTUAL_KEY',               // Your API key
  apiPassword: 'YOUR_ACTUAL_PASSWORD',     // Your API password
  sysUserId: 'YOUR_ACTUAL_USER_ID',        // Your system user ID
  syncEnabled: true,
  syncDateRange: 1, // Fetch last 1 day of jobs
  useModifiedDate: false
};
```

3. Run the setup script:

```powershell
cd backend
node setup-ilabor-api.js
```

4. If successful, you'll see:
```
✅ SUCCESS! Successfully connected to iLabor360 API
🎉 iLabor360 REST API is now configured and working!
```

#### Option B: Manual Configuration via API

Use POST request to `/api/ilabor360/config`:

```json
{
  "apiUsername": "your-username",
  "apiKey": "your-key",
  "apiPassword": "your-password",
  "sysUserId": "your-user-id",
  "syncEnabled": true,
  "syncDateRange": 1,
  "useModifiedDate": false
}
```

---

## 🔄 Syncing Jobs

### Manual Sync

**Via Frontend:**
1. Navigate to Settings → iLabor360 Integration
2. Click "Sync Now" button

**Via API:**
```bash
curl -X POST http://localhost:5000/api/ilabor360/sync
```

### Auto Sync (Optional)

Enable automatic syncing by updating configuration:

```json
{
  "autoSync": true,
  "syncInterval": 30  // Sync every 30 minutes
}
```

---

## 📊 API Endpoints

### Configuration

#### GET `/api/ilabor360/config`
Get current configuration (credentials are masked)

**Response:**
```json
{
  "success": true,
  "config": {
    "apiUsername": "your-username",
    "apiKey": "********",
    "apiPassword": "********",
    "sysUserId": "your-user-id",
    "connectionStatus": "connected",
    "syncEnabled": true,
    "syncDateRange": 1
  }
}
```

#### POST `/api/ilabor360/config`
Update configuration

**Body:**
```json
{
  "apiUsername": "new-username",
  "apiKey": "new-key",
  "apiPassword": "new-password",
  "sysUserId": "new-user-id"
}
```

### Testing

#### POST `/api/ilabor360/test-connection`
Test API connection and authentication

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to iLabor360 API"
}
```

### Syncing

#### POST `/api/ilabor360/sync`
Manually trigger job sync

**Response:**
```json
{
  "success": true,
  "message": "Sync completed! Added 5, updated 3, skipped 2 requisitions.",
  "stats": {
    "requisitions": {
      "found": 10,
      "added": 5,
      "updated": 3,
      "skipped": 2
    },
    "durationMs": 3452,
    "errors": 0
  }
}
```

### Statistics

#### GET `/api/ilabor360/stats`
Get sync statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRequisitionsSynced": 150,
    "lastSyncDate": "2025-11-12T10:30:00Z",
    "lastSyncRequisitionCount": 10,
    "errorCount": 2,
    "recentSyncs": [...]
  }
}
```

#### GET `/api/ilabor360/sync-logs?limit=20`
Get sync history logs

---

## 🔒 Security

### Encryption

All sensitive credentials are encrypted using **AES-256-GCM** before storage:
- API Key
- API Password

**Encryption Key:** Set in `.env` file as `ENCRYPTION_KEY` (64-character hex string)

### Token Caching

API tokens are cached for **14 minutes** (15-minute validity with 1-minute buffer) to minimize login requests.

---

## 📅 Date Range Configuration

The API has constraints on date ranges:

- **Maximum:** 3 days
- **Recommended:** 1 day
- **Default:** 1 day

### Date Types

1. **Regular Dates** (`StartDate` / `EndDate`)
   - Filters by requisition release date
   - Use for initial sync

2. **Modified Dates** (`modifyStartDate` / `modifyEndDate`)
   - Filters by last modification date
   - Use for incremental syncs
   - Set `useModifiedDate: true` in config

---

## 🗺️ Field Mapping

### iLabor360 API → UnifiedJob Model

| iLabor360 Field | UnifiedJob Field | Notes |
|-----------------|------------------|-------|
| `job_title_code` | `title` | Fallback to `position_type_name` |
| `job_description` | `description` | - |
| `customer_name` | `company` | Fallback to `client_name` |
| `primary_skill_set` | `requiredSkills` | Comma-separated, combined with secondary/other |
| `location.city/state` | `location` | Formatted as "City, State, Country" |
| `status_name` | `status` | Mapped to: open, closed, on-hold |
| `no_of_positions` | `positions` | - |
| `department_name` | `department` | - |
| `req_owner` | `recruiterAssigned` | - |
| `requisition_id` | `sources[0].metadata.requisition_id` | - |

### Stored Metadata

All original API fields are preserved in `sources[0].metadata` for reference:
- Bill rates
- Background check requirements
- Drug screen requirements
- Supplemental fields
- Contact information
- And more...

---

## ⚠️ Known Limitations

1. **Read-Only Access**
   - Can only retrieve released requisitions
   - Cannot add/update candidates via API
   - Cannot submit candidates via API

2. **Date Range**
   - Maximum 3-day range per request
   - Best practice: sync daily with 1-day range

3. **Token Expiration**
   - Tokens expire after 15 minutes
   - Automatically handled with caching

---

## 🐛 Troubleshooting

### "Authentication Failed" Error

**Causes:**
- Incorrect API credentials
- API Key or Password mistyped
- Account doesn't have API access

**Solution:**
1. Verify credentials with iLabor360 account manager
2. Re-run setup script with correct credentials
3. Test connection: POST `/api/ilabor360/test-connection`

### "Unable to connect to iLabor360 API"

**Causes:**
- Network connectivity issues
- Firewall blocking outbound HTTPS
- iLabor360 API server down

**Solution:**
1. Check internet connection
2. Test API manually: `curl https://api.ilabor360.com/v2/rest/`
3. Contact iLabor360 support

### "Failed to decrypt credentials"

**Causes:**
- `ENCRYPTION_KEY` changed in `.env`
- Database contains old encrypted data

**Solution:**
1. Check `ENCRYPTION_KEY` in `.env`
2. Re-save credentials using setup script
3. Or delete old config and reconfigure

### No Jobs Synced

**Causes:**
- No released requisitions in date range
- Incorrect `sysUserId`
- Date range too narrow

**Solution:**
1. Increase `syncDateRange` to 3 days
2. Verify `sysUserId` with iLabor360
3. Check sync logs for detailed errors

---

## 📝 Testing

### Quick Test Script

Create `backend/test-ilabor-api.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const service = require('./src/services/iLabor360Service').default;
  
  // Test connection
  console.log('Testing connection...');
  const result = await service.testConnection();
  console.log('Result:', result);
  
  // Test sync
  console.log('\nTesting sync...');
  const syncResult = await service.syncAll('default-user', 'manual');
  console.log('Sync Result:', syncResult);
  
  await mongoose.disconnect();
}

test().catch(console.error);
```

Run: `node test-ilabor-api.js`

---

## 📞 Support

For API-related issues:
- **iLabor360 Support:** Contact your account manager
- **Application Issues:** Check sync logs at `/api/ilabor360/sync-logs`
- **Documentation:** Refer to iLabor360 REST API v2.0 documentation

---

## 🔄 Migration Notes

### From Web Scraping to REST API

The database schema is **backward compatible**. Old jobs will continue to work, and new jobs will be synced via the REST API.

**Migration Steps:**
1. Stop any running web scraper services
2. Install API credentials (this guide)
3. Test connection
4. Run manual sync
5. Verify jobs appear in pipeline

**No data loss** - existing synced jobs remain in the database.

---

## 📚 Additional Resources

- [iLabor360 API Documentation](https://api.ilabor360.com/v2/rest/docs) (if available)
- [Setup Script](./setup-ilabor-api.js)
- [Service Code](./src/services/iLabor360Service.ts)
- [Config Model](./src/models/iLabor360Config.ts)

---

**Last Updated:** November 12, 2025
**API Version:** 2.0
**Integration Type:** REST API with Tokenization
