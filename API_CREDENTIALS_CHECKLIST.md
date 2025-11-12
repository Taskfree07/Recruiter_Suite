# ✅ iLabor360 API Credentials - Search Checklist

## Quick Reference

**Portal:** https://vendor.ilabor360.com/login  
**Your Login:** Matt.s@techgene.com / King@1234

---

## 🔍 Places to Check (in order)

### High Priority - Check First

- [ ] **Profile/Account Settings** (top right corner)
  - Look for: API, Integration, Developer tabs

- [ ] **Settings Menu** (gear icon ⚙️)
  - Check for: API Settings, REST API, Integration

- [ ] **Main Navigation Menu** (left sidebar or top menu)
  - Look for: API, Integrations, Developer, Tools

### Medium Priority

- [ ] **Company/Organization Settings**
  - Advanced settings or system configuration

- [ ] **Help/Support Section**
  - Sometimes has API documentation links

- [ ] **Footer Links**
  - API Docs, Developer Portal

### Also Check

- [ ] **Email Inbox** - Search for:
  - "iLabor360 API"
  - "API credentials"
  - "REST API"
  - "Integration setup"
  - Emails from iLabor360 when account was created

- [ ] **Dashboard Widgets**
  - Sometimes API info is shown on main dashboard

---

## 📝 What to Document

When you find API-related pages, note:

```
Page Title: _________________________________

URL: ________________________________________

Fields Found:
[ ] API Username / User ID / Client ID
[ ] API Key / Access Key / Token
[ ] API Password / Secret / Client Secret
[ ] System User ID / Account ID

Other Info:
_____________________________________________
_____________________________________________
```

---

## 🚨 Common Issues

### "API Access Not Enabled"
- Look for "Enable API" or "Request API Access" button
- May need admin approval
- Contact your account manager

### "Generate API Key" Button
- Click it to create new credentials
- Save them immediately (may only show once)

### "API Key is Hidden"
- Look for "Show" or "Reveal" button
- May need to confirm identity

---

## 📞 If Not Found in Portal

**Contact iLabor360:**

**Email Template:**
```
To: [Your Account Manager Email]
Subject: REST API v2.0 Credentials Request

Hi,

I'm trying to integrate our ATS with iLabor360 REST API v2.0 
and need the following credentials:

1. API Username (userName)
2. API Key (key)
3. API Password (password)
4. System User ID (sysUserID)

My portal account: Matt.s@techgene.com

Can you please provide these or direct me to where I can 
find them in the vendor portal?

Thank you!
```

**Or Call:**
- iLabor360 Support
- Your account manager
- Technical support team

---

## ✅ Once You Find Them

Run this test immediately:

```powershell
cd backend
node quick-test-token.js "YOUR_USERNAME" "YOUR_KEY" "YOUR_PASSWORD" "YOUR_USER_ID"
```

Should see:
```
✅ SUCCESS! Token generated:
   f2f0c797-1f41-46b7-b1a3-***********
```

---

## 🎯 Current Status

- [x] Portal login credentials available
- [x] API integration code ready
- [x] Test scripts created
- [ ] **NEED: API credentials from portal or account manager**

---

**Start by logging into the portal now and exploring! Report back what you find! 🚀**
