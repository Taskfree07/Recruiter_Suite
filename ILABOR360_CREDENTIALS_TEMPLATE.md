# iLabor360 API Credentials Configuration

## 📋 Required Information

Please fill in your iLabor360 REST API v2.0 credentials below:

---

### **API Username** (userName)
```
Value: _______________________________________
```

### **API Key** (key)
```
Value: _______________________________________
```

### **API Password** (password)
```
Value: _______________________________________
```
**Note:** This is NOT your vendor portal password (King@1234). This is a separate API password.

### **System User ID** (sysUserID)
```
Value: _______________________________________
```

---

## 🔍 Where to Get These Credentials

**Contact:** Your iLabor360 Account Manager

**What to Ask For:**
"I need REST API v2.0 credentials including:
- API Username
- API Key  
- API Password
- System User ID"

**Important Notes:**
- These are DIFFERENT from your vendor portal credentials
- Your portal login (Matt.s@techgene.com / King@1234) won't work for the API
- API access must be enabled on your account

---

## ✅ Once You Have Credentials

### Option 1: Quick Test (Recommended)

1. Edit `backend/test-ilabor-token.js`
2. Lines 14-17: Replace placeholders with your credentials
3. Run: `node backend/test-ilabor-token.js`
4. If successful, proceed to Option 2

### Option 2: Save to Database

1. Edit `backend/setup-ilabor-api.js`
2. Lines 32-35: Replace placeholders with your credentials
3. Run: `node backend/setup-ilabor-api.js`
4. Credentials will be encrypted and saved

---

## 📞 Support

**For API Credentials:** Contact iLabor360 Account Manager  
**For Technical Issues:** Check test output for detailed error messages

---

**Status:** ⏳ Waiting for API credentials
**Last Updated:** November 12, 2025
