# Fix Ceipal 403 Error - Action Required 🔑

## Problem
Getting **403 Forbidden** error from Ceipal API with message:
```
"Invalid credentials or token, Please provide valid Access Token"
```

## Root Cause
Ceipal API requires a **Bearer Token / API Key** for authentication, not username/password.

---

## ✅ Solution: Get Your API Key from Ceipal

### Step 1: Login to Ceipal
1. Go to https://app.ceipal.com
2. Login with your credentials:
   - Username: `pankaj.b@techgene.com`
   - Password: `Jupiter@9090`

### Step 2: Navigate to API Settings
1. Click your profile icon (top-right)
2. Go to **Settings** or **API Settings**
3. Look for **API Key** or **Access Token** section

### Step 3: Generate or Copy API Key
- If you see an existing API Key → **Copy it**
- If no key exists → Click **Generate API Key** → **Copy the new key**

**⚠️ Important**: Save this key securely - you may not be able to see it again!

### Step 4: Enter in Your Application
1. Open your ATS Resume Optimizer application
2. Navigate to **Ceipal Settings** page
3. Find the **"API Key / Access Token"** field
4. Paste your API key
5. Keep other fields as configured:
   - Tenant ID: `Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09`
   - Company ID: `b6d6b4f843d706549fa2b50f2dc9612a`
5. Click **"Save Configuration"**
6. Click **"Test Connection"**

---

## Expected Result
✅ Connection successful  
✅ API responds with job data  
✅ No more 403 errors  

---

## If You Can't Find API Settings

### Alternative: Contact Ceipal Support
- Email: support@ceipal.com
- Ask: "How do I generate an API Key for REST API access?"
- Mention: You need it for the `/getCustomJobPostingDetails` endpoint

### Alternative: Check Documentation
- Look in Ceipal's help docs under "API" or "Integrations"
- Search for "API Key", "Bearer Token", or "Authentication"

---

## Current Configuration Status

Your system is **fully configured** and ready to work - it just needs the valid API key:

✅ Backend supports Bearer token authentication  
✅ All 73 Ceipal field mappings configured  
✅ Multi-tenant architecture implemented  
✅ Routes properly set up  
✅ Frontend UI ready  

**Only missing**: The actual API key from your Ceipal account!

---

## Testing After Adding API Key

Once you enter the API key:

1. **Test Connection**
   - Click "Test Connection" button
   - Should show: "Connection successful!"

2. **Sync Jobs**
   - Go to Job Pipeline page
   - Click "Sync from Ceipal"
   - Should fetch all jobs from your Ceipal account

3. **View Jobs**
   - All synced jobs will appear in Job Pipeline
   - You'll see all 73 mapped fields
   - Can match candidates to jobs

---

## Quick Reference

### Your Ceipal Details
```
Username: pankaj.b@techgene.com
Password: Jupiter@9090
Tenant ID: Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09
Company ID: b6d6b4f843d706549fa2b50f2dc9612a
API Endpoint: https://api.ceipal.com/getCustomJobPostingDetails/{tenantId}/{companyId}
```

### What's Missing
```
API Key / Access Token: [NEED TO GET FROM CEIPAL DASHBOARD]
```

---

## Next Steps

1. ✅ **Get API Key** from Ceipal dashboard (see Step 1-3 above)
2. ✅ **Enter API Key** in Ceipal Settings page
3. ✅ **Test Connection** to verify it works
4. ✅ **Sync Jobs** to fetch all job postings
5. ✅ **Start using** the Job Pipeline!

---

## Need Help?

If you get stuck finding the API key, you can:
- Share a screenshot of your Ceipal dashboard settings
- Contact Ceipal support for guidance
- Check if your account has API access enabled

The system is ready to go as soon as you provide the API key! 🚀
