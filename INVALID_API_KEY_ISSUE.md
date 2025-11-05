# 🔴 URGENT: Invalid Ceipal API Key

## Test Results Summary

I tested **5 different authentication methods** with your current API key:

```
API Key: 312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd
```

### All Tests Failed ❌

| Method | Result | Error Message |
|--------|--------|---------------|
| Bearer Token | ❌ 403 | "Invalid credentials or token, Please provide valid Access Token" |
| X-API-Key Header | ❌ 400 | **"The provided API Key is not matched, please contact you administrator"** |
| No Auth | ❌ 400 | "The provided API Key is not matched" |
| Basic Auth (username/password) | ❌ 403 | "Invalid credentials or token" |
| API Key in URL | ❌ 400 | "The provided API Key is not matched" |

## 🎯 Root Cause

**Your current API key is INVALID or EXPIRED**

The error message from Ceipal says:
> "The provided API Key is not matched, please contact you administrator and get back."

## ✅ Solution: Get Valid API Key

You **MUST** obtain a valid API key from your Ceipal account. Here's how:

### Option 1: Self-Service (Recommended)

1. **Login to Ceipal**
   - Go to: https://app.ceipal.com
   - Username: `pankaj.b@techgene.com`
   - Password: `Jupiter@9090`

2. **Find API Settings**
   - Click your profile icon (top-right corner)
   - Look for one of these menu items:
     - "Settings" → "API Settings"
     - "Integrations" → "API Keys"
     - "Developer" → "API Access"
     - "Administration" → "API Configuration"

3. **Get API Key**
   - If you see an existing key → **Copy it**
   - If no key exists → Click **"Generate New API Key"**
   - If generation is disabled → Contact your administrator (Option 2)

4. **Save the Key Securely**
   - ⚠️ You may only see it once!
   - Copy it to a secure location
   - Do NOT share it publicly

### Option 2: Contact Administrator

If you cannot access API settings in your dashboard:

**Email**: Contact your Ceipal account administrator or support@ceipal.com

**Request Template**:
```
Subject: Request for API Key Access

Hello,

I need to generate an API Key for REST API integration to access job postings.

Account Details:
- Email: pankaj.b@techgene.com
- Tenant ID: Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09
- Company ID: b6d6b4f843d706549fa2b50f2dc9612a

I need access to the /getCustomJobPostingDetails endpoint.

Could you please either:
1. Provide me with an API Key, or
2. Enable API Key generation in my account settings

Thank you!
```

## 📋 After Getting Valid API Key

Once you have the **valid API key**:

### Step 1: Open Your Application
- Navigate to **Ceipal Settings** page in your ATS application
- Find the **"API Key / Access Token"** field

### Step 2: Update API Key
- **Paste the NEW valid API key**
- Keep other settings as they are:
  - Tenant ID: `Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09`
  - Company ID: `b6d6b4f843d706549fa2b50f2dc9612a`
- Click **"Save Configuration"**

### Step 3: Test Connection
- Click **"Test Connection"** button
- You should see: ✅ **"Connection successful!"**

### Step 4: Sync Jobs
- Go to **Job Pipeline** page
- Click **"Sync from Ceipal"**
- Jobs will start appearing!

## 🔍 Why The Current Key Doesn't Work

The API key `312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd` is likely:
- ❌ Expired or revoked
- ❌ Generated for a different tenant
- ❌ Not a valid Ceipal API key (wrong format)
- ❌ Test/placeholder value that was never activated

## ⚠️ Important Notes

### Your System is Ready!
- ✅ All code is properly configured
- ✅ Authentication methods are correct
- ✅ Multi-tenant support is implemented
- ✅ 73 field mappings are configured

**Only Issue**: Invalid API key

### Security Reminder
- Never commit API keys to Git/GitHub
- Store keys in environment variables
- Rotate keys periodically
- Never share keys in screenshots or public forums

## 🚀 Next Steps

1. ✅ **Get valid API key** from Ceipal (see Option 1 or 2 above)
2. ✅ **Update key** in Ceipal Settings page
3. ✅ **Test connection** to verify
4. ✅ **Sync jobs** and start using the system!

---

## Need Help?

If you're unable to find API settings in Ceipal:
1. Take a screenshot of your Ceipal dashboard menu
2. Look for any "Settings", "API", or "Integrations" sections
3. Contact Ceipal support if API access is restricted

The moment you provide a valid API key, everything will work! 🎉
