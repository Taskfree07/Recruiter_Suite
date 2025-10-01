# Troubleshooting Guide - "Failed to import job description"

## Common Causes and Solutions

### 1. **Backend Server Not Running**
**Check if backend is running:**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Or try accessing the API
curl http://localhost:5000/api/jobs
```

**Start the backend:**
```bash
cd backend
npm run dev
```

### 2. **MongoDB Not Running**
The backend requires MongoDB to be running.

**Check MongoDB status:**
```bash
# Check if MongoDB process is running
Get-Process | Where-Object {$_.ProcessName -like "*mongo*"}
```

**Start MongoDB:**
- If using MongoDB Community Edition: Start MongoDB service
- If using MongoDB Atlas: Check your connection string in `.env`

**Create `.env` file in backend folder:**
```env
MONGODB_URI=mongodb://localhost:27017/ats_resume_optimizer
PORT=5000
NODE_ENV=development
```

### 3. **CORS Issues**
If you see CORS errors in the browser console:

**Check backend CORS configuration** (`backend/src/server.ts`):
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

### 4. **File Upload Issues**

**Check file size limits:**
- Default limit is 10MB in `backend/src/server.ts`
- Ensure your file is within this limit

**Check file format:**
- Supported formats: PDF, DOC, DOCX, TXT
- Verify the file is not corrupted

### 5. **Missing Dependencies**

**Install backend dependencies:**
```bash
cd backend
npm install
```

**Install frontend dependencies:**
```bash
cd frontend
npm install
```

### 6. **Parser Service Issues**

The backend uses `pdf-parse` and `mammoth` to extract text from files.

**Check if parser dependencies are installed:**
```bash
cd backend
npm list pdf-parse mammoth
```

### 7. **Network/API URL Issues**

**Check API URL in frontend** (`frontend/src/services/jobService.ts`):
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

Make sure this matches your backend port.

### 8. **Database Connection Issues**

**Check MongoDB connection in backend logs:**
```
MongoDB connected successfully
```

If you see connection errors, verify:
- MongoDB is running
- Connection string in `.env` is correct
- Database name exists or can be created

## How to Debug

### 1. Check Browser Console
Open Developer Tools (F12) and check the Console tab for errors.

### 2. Check Network Tab
- Go to Network tab in Developer Tools
- Try uploading a file
- Look for the `/api/jobs/upload` or `/api/jobs/import-text` request
- Check the response status and error message

### 3. Check Backend Logs
Look at the terminal where the backend is running for error messages.

### 4. Test API Directly

**Test job upload with curl:**
```bash
curl -X POST http://localhost:5000/api/jobs/import-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"We are looking for a Senior Developer with 5 years experience in React and Node.js\",\"company\":\"Test Company\"}"
```

## Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] MongoDB is running
- [ ] `.env` file exists in backend folder with MONGODB_URI
- [ ] Frontend is running (`npm start` in frontend folder)
- [ ] No CORS errors in browser console
- [ ] File format is supported (PDF, DOC, DOCX, TXT)
- [ ] File size is under 10MB
- [ ] All dependencies are installed (`npm install` in both folders)

## Still Having Issues?

1. **Clear browser cache** and reload
2. **Restart both servers** (frontend and backend)
3. **Check firewall settings** - ensure port 5000 and 3000 are not blocked
4. **Try using text input mode** instead of file upload to isolate the issue
