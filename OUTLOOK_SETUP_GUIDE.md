# Outlook Integration Setup Guide

This guide will help you configure the Outlook integration to sync resumes from your emails.

## ✅ What's Already Done

Your Outlook integration is **fully implemented** and ready to use! Here's what's been built:

- ✅ Microsoft Graph API service for Outlook access
- ✅ OAuth 2.0 login flow
- ✅ Backend API endpoints for auth and sync
- ✅ Frontend UI with "Connect Outlook" and "Sync" buttons
- ✅ Modal with "Last Month" vs "All Emails" options
- ✅ "Clear Outlook Data" functionality
- ✅ Automatic resume detection from email attachments
- ✅ Resume parsing and categorization

## 🔧 Configuration Required

You need to add your Azure credentials to the `.env` file:

### Step 1: Add Credentials to .env

Open `backend/.env` and replace these placeholders:

```env
# Microsoft Outlook Integration
OUTLOOK_CLIENT_ID=your-client-id-here          # Replace with your Azure App Client ID
OUTLOOK_CLIENT_SECRET=your-client-secret-here  # Replace with your Azure App Client Secret
OUTLOOK_TENANT_ID=your-tenant-id-here          # Replace with your Azure Tenant ID
OUTLOOK_REDIRECT_URI=http://localhost:5000/api/outlook/auth/callback
```

### Step 2: Configure Azure Redirect URI

In your Azure Portal App Registration, make sure you've added this Redirect URI:

```
http://localhost:5000/api/outlook/auth/callback
```

**For Production:** Update the `OUTLOOK_REDIRECT_URI` in `.env` to your production backend URL:
```env
OUTLOOK_REDIRECT_URI=https://your-backend-domain.com/api/outlook/auth/callback
```

And add the production URL to Azure Portal as well.

---

## 🚀 How to Use

### 1. Start the Application

```bash
# Backend
cd backend
npm run dev

# Frontend (in new terminal)
cd frontend
npm start
```

### 2. Connect Outlook

1. Go to **Resume Dashboard**
2. Click the **"Connect Outlook"** button (gray button with envelope icon)
3. You'll be redirected to **Microsoft Login**
4. Sign in with your Microsoft/Outlook account
5. **Grant permissions** when prompted
6. You'll be redirected back to the dashboard

### 3. Sync Resumes

Once connected, the button will turn **blue** and say **"Sync Outlook"**:

1. Click **"Sync Outlook"**
2. Choose sync option:
   - **Last Month** - Sync resumes from past 30 days (recommended)
   - **All Emails** - Sync all resumes from your inbox
3. Click **"Start Sync"**
4. Wait for the sync to complete (you'll see a success message)

### 4. Clear Outlook Data

To remove all Outlook-synced resumes:

1. Click **"Sync Outlook"** button
2. In the modal, click **"Clear Outlook Resumes"** at the bottom
3. Confirm the action

---

## 🔍 What Gets Synced?

The integration automatically:

1. **Searches your Outlook emails** for messages with attachments
2. **Filters for resume files**:
   - PDF, DOCX, DOC formats
   - Files with "resume" or "CV" in filename
   - Emails with "resume", "application", or "candidate" in subject
3. **Parses each resume** to extract:
   - Personal info (name, email, phone, location)
   - Skills (technical, frameworks, databases, cloud)
   - Experience and education
   - Categorization by role type
4. **Scores each resume** based on:
   - Skill relevance
   - Experience quality
   - Education
   - Freshness (how recent)
   - Resume completeness

---

## ⚙️ Azure Permissions Required

Make sure these permissions are configured in Azure Portal:

**Delegated Permissions:**
- ✅ `Mail.Read` - Read user's email
- ✅ `Mail.ReadBasic` - Read basic email properties
- ✅ `User.Read` - Read user profile

**Admin Consent:**
- If you're not the tenant admin, you'll need admin approval for these permissions
- Once approved, all features will work

---

## 🔒 Security & Privacy

- **OAuth 2.0** - Secure Microsoft authentication
- **Access tokens** stored temporarily in server memory
- **Tokens expire** after 1 hour (user needs to reconnect)
- **Read-only** - App only reads emails, never modifies or sends
- **No email storage** - Only resume files are saved, not email content

---

## 🐛 Troubleshooting

### "Outlook service not configured"
- **Cause:** Missing environment variables
- **Fix:** Add your Azure credentials to `backend/.env`

### "Not authenticated. Please login with Outlook first"
- **Cause:** Token expired or not connected
- **Fix:** Click "Connect Outlook" again

### "Admin approval required"
- **Cause:** Tenant requires admin consent for permissions
- **Fix:** Contact your Azure tenant admin to approve the app

### No resumes synced
- **Cause:** No resume attachments found in emails
- **Fix:** Check that:
  - Emails have PDF/DOCX attachments
  - Filenames or subjects contain "resume" or "CV"
  - Date range is correct (last month vs all)

### "Token expired. Please reconnect"
- **Cause:** Access token expired (expires after 1 hour)
- **Fix:** Click "Connect Outlook" again to refresh authentication

---

## 📊 Sync Statistics

The dashboard shows:
- **Total Outlook resumes** synced
- **Last month count** - resumes from past 30 days
- **Last sync time** - when you last synced

---

## 🎯 Features Summary

| Feature | Status |
|---------|--------|
| OAuth Login | ✅ Ready |
| Sync Last Month | ✅ Ready |
| Sync All Emails | ✅ Ready |
| Auto Resume Detection | ✅ Ready |
| Resume Parsing | ✅ Ready |
| Skill Categorization | ✅ Ready |
| Score Calculation | ✅ Ready |
| Clear Outlook Data | ✅ Ready |
| Duplicate Handling | ✅ Ready (updates existing) |
| Token Refresh | ⏳ Manual reconnect needed |

---

## 🚀 Next Steps After Setup

1. **Add your Azure credentials** to `backend/.env`
2. **Restart the backend** server
3. **Connect your Outlook** account
4. **Sync resumes** from your emails
5. **View resumes** in the Resume Dashboard

---

## 💡 Tips

- **Use "Last Month"** for faster syncs and recent candidates
- **Sync regularly** to keep your database updated
- **Check email subjects** - emails with "application" or "resume" in subject are prioritized
- **File naming** - files named with "resume" or "CV" are automatically detected
- **Token expiry** - If sync fails, reconnect Outlook

---

## 📞 Support

If you encounter issues:
1. Check backend console logs for detailed error messages
2. Check frontend browser console for network errors
3. Verify Azure app permissions are granted
4. Ensure redirect URI matches exactly in Azure and `.env`

---

**🎉 You're all set! Once you add your credentials, the integration will be fully functional.**
