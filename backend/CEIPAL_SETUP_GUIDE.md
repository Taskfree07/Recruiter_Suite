# Ceipal Credentials Setup Guide

## 🎯 Quick Setup (Recommended)

If you have your credentials ready, use this one-liner:

```bash
node quick-setup-ceipal.js <your-email> <your-password> <your-api-key> [resume-api-url]
```

**Example:**
```bash
node quick-setup-ceipal.js pankaj.b@techgene.com MyPassword123 abc123xyz456def
```

**With Resume API URL:**
```bash
node quick-setup-ceipal.js pankaj.b@techgene.com MyPassword123 abc123xyz456def https://api.ceipal.com/getCustomSubmissionDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a/
```

---

## 📋 Interactive Setup

For a guided setup with prompts:

```bash
node setup-ceipal-credentials.js
```

This will ask you for each credential one by one.

---

## 👀 View Current Configuration

To check what's currently configured:

```bash
node view-ceipal-config.js
```

---

## 🧪 Test Your Setup

After configuring, test the connection:

```bash
node test-auth-from-db.js
```

---

## 🌐 Using the Frontend Settings Page

1. **Start the backend:**
   ```bash
   npm start
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   cd ../frontend
   npm start
   ```

3. **Navigate to Settings:**
   - Open your browser: http://localhost:3000
   - Go to: **Ceipal Settings** page (URL: `/ceipal-settings`)
   - Or click the "Configure Ceipal" button from any page

4. **Fill in the form:**
   - Email (Username)
   - Password
   - API Key
   - Resume API URL (optional)
   - Turn OFF Mock Mode
   - Click "Save Configuration"

5. **Test Connection:**
   - Click "Test Connection" button
   - Should show success message

6. **Sync Data:**
   - Click "Sync Jobs Now" to fetch jobs
   - Click "Sync Resumes" to fetch resumes

---

## 🔑 What You Need

### Required Credentials:

1. **Email:** Your Ceipal login email
2. **Password:** Your Ceipal login password  
3. **API Key:** From Ceipal Dashboard → Settings → API

### Optional but Recommended:

4. **Resume API URL:** Your specific resume endpoint URL
   - Format: `https://api.ceipal.com/getCustomSubmissionDetails/{tenantId}/{companyId}/`
   - You can get this from your Ceipal account

5. **Module:** Usually "ATS" (Applicant Tracking System)
   - Default is already set to "ATS"

---

## 🐛 Troubleshooting

### Issue: 403 Forbidden Error

**Fixed!** The authentication now includes the `module: 'ATS'` parameter, which was causing the 403 error.

### Issue: Can't see Ceipal Settings page

**Solution:** The page exists at `/ceipal-settings`. Just navigate to:
```
http://localhost:3000/ceipal-settings
```

Or use one of the setup scripts above to configure via command line.

### Issue: "Invalid API Key"

**Check:**
- Make sure you're using the correct API key from Ceipal
- API key should NOT be "MOCK_API_KEY"
- Turn off Mock Mode if it's enabled

### Issue: "Email or Password missing"

**Check:**
- Email field should contain your Ceipal login email
- Password should be set (not empty)
- Run `node view-ceipal-config.js` to check what's stored

---

## 📝 Notes

- All credentials are stored in MongoDB database
- Module defaults to "ATS" (Applicant Tracking System)
- Mock mode should be OFF for real API access
- Resume API URL is optional but recommended for resume sync

---

## 🚀 Quick Start Checklist

- [ ] Run `node view-ceipal-config.js` to see current config
- [ ] Run `node quick-setup-ceipal.js <email> <password> <api-key>` to set credentials
- [ ] Run `node test-auth-from-db.js` to test authentication
- [ ] Start backend: `npm start`
- [ ] Start frontend: `cd ../frontend && npm start`
- [ ] Navigate to http://localhost:3000/ceipal-settings
- [ ] Click "Test Connection"
- [ ] Click "Sync Jobs Now" or "Sync Resumes"

---

## 📞 Support Scripts

| Script | Purpose |
|--------|---------|
| `quick-setup-ceipal.js` | Fast credential setup with command args |
| `setup-ceipal-credentials.js` | Interactive credential setup |
| `view-ceipal-config.js` | View current configuration |
| `test-auth-from-db.js` | Test authentication with stored credentials |
| `test-ceipal-resume-auth.js` | Test resume API authentication |
| `test-complete-flow.js` | Test complete authentication flow |

