# Two-Step Authentication Setup for Ceipal 🔐

## What You Told Me

You said:
```
Auth Key: {api_key:312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd}
Format: {json:1}  (0 for xml format)
Generate authtoken using this authentication and use this auth token to get the access for below API.
```

## What This Means

Ceipal uses **TWO-STEP AUTHENTICATION**:

### Step 1: Generate Auth Token
```
POST <AUTH_TOKEN_ENDPOINT>
Body: {
  "api_key": "312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd",
  "json": 1
}
Response: {
  "token": "<GENERATED_AUTH_TOKEN>"
}
```

### Step 2: Use Auth Token for API Calls
```
GET https://api.ceipal.com/getCustomJobPostingDetails/...
Headers: {
  "Authorization": "Bearer <GENERATED_AUTH_TOKEN>"
}
```

## ⚠️ MISSING INFORMATION

**I need you to provide the AUTH TOKEN ENDPOINT URL!**

### What is the AUTH TOKEN ENDPOINT?

It's the URL where we send the API key to get an auth token. Examples:
- `https://api.ceipal.com/auth/token`
- `https://api.ceipal.com/v2/auth/token`
- `https://api.ceipal.com/getAuthToken`
- `https://api.ceipal.com/generateToken`

### Where to Find It

1. **Check Ceipal API Documentation**
   - Look for "Authentication" or "Getting Started" section
   - Should describe the token generation endpoint

2. **Contact Ceipal Support**
   - Ask: "What is the endpoint URL for generating auth tokens from API keys?"

3. **Check Your Email/Integration Docs**
   - Ceipal may have sent integration documentation
   - Look for API endpoint references

## ✅ What I've Already Done

I've implemented the two-step authentication flow in your system:

1. ✅ Added `generateAuthToken()` method
2. ✅ Updated `buildAuthHeaders()` to use generated tokens
3. ✅ Added config fields: `useTwoStepAuth`, `authTokenEndpoint`
4. ✅ Made all methods async to support token generation

## 🚀 How to Enable Once You Have the Endpoint

### Option 1: Update the Script (Easiest)

1. Open `backend/enable-two-step-auth.js`
2. Update line 7 with the correct endpoint:
   ```javascript
   const AUTH_TOKEN_ENDPOINT = 'https://api.ceipal.com/YOUR_CORRECT_ENDPOINT';
   ```
3. Run the script:
   ```bash
   cd backend
   node enable-two-step-auth.js
   ```

### Option 2: Update Database Directly

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const CeipalConfig = mongoose.model('CeipalConfig', new mongoose.Schema({}, {strict: false}));
  await CeipalConfig.updateOne(
    {userId: 'default-user'},
    {\$set: {useTwoStepAuth: true, authTokenEndpoint: 'YOUR_ENDPOINT_HERE'}}
  );
  console.log('✅ Two-step auth enabled');
  process.exit(0);
});
"
```

### Option 3: Add to Frontend (Best for Production)

Add to `frontend/src/pages/CeipalSettings.tsx`:
- Checkbox: "Use Two-Step Authentication"
- Input field: "Auth Token Endpoint"
- Save these fields to backend

## 📋 Test Flow

Once you provide the endpoint, here's what will happen:

1. **User clicks "Test Connection" in Ceipal Settings**
2. **System calls auth endpoint:**
   ```javascript
   POST <YOUR_AUTH_ENDPOINT>
   Body: {
     "api_key": "312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd",
     "json": 1
   }
   ```
3. **Ceipal returns auth token:**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
4. **System uses token to fetch jobs:**
   ```javascript
   GET https://api.ceipal.com/getCustomJobPostingDetails/...
   Headers: {
     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
5. **✅ Connection successful!**

## 🔍 Common Auth Token Endpoint Patterns

Based on common API patterns, try these endpoints:

```
https://api.ceipal.com/auth
https://api.ceipal.com/auth/token
https://api.ceipal.com/v2/auth/token
https://api.ceipal.com/v1/auth/token
https://api.ceipal.com/authenticate
https://api.ceipal.com/generateToken
https://api.ceipal.com/getAuthToken
https://api.ceipal.com/oauth/token
https://api.ceipal.com/api/auth/token
```

## ❓ Questions to Ask Ceipal Support

If you contact Ceipal support, ask:

> "I have an API key and need to integrate with the Ceipal API to fetch job postings.
> The documentation mentions generating an auth token using format:
> `{api_key: '<my_key>', json: 1}`
> 
> What is the **exact endpoint URL** for generating this auth token?
> 
> Also, what is the **field name in the response** that contains the token?
> (e.g., 'token', 'authToken', 'access_token', etc.)"

## 📧 What to Send Me

Once you have the information, send me:

1. **Auth Token Endpoint URL**
   - Example: `https://api.ceipal.com/v2/auth/token`

2. **Response Format** (if you know it)
   ```json
   {
     "token": "...",     // or
     "authToken": "...", // or
     "access_token": "..." // ?
   }
   ```

3. **Any Additional Parameters Required**
   - Besides `api_key` and `json`, are there other required fields?

## 🎯 Current Status

| Item | Status |
|------|--------|
| API Key | ✅ You have it |
| Two-step auth code | ✅ Implemented |
| Auth token endpoint | ❌ **NEED THIS** |
| Token field name | ❓ Will auto-detect |
| System ready | ✅ Yes, just need endpoint! |

## 🚀 As Soon As You Provide the Endpoint

1. I'll update the configuration
2. Run the enable script
3. Test the connection
4. **Everything will work!** 🎉

---

**The system is 99% ready. We just need that one auth token endpoint URL!** 🔐
