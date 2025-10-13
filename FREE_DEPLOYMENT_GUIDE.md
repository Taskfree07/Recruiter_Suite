# Free Deployment Guide - Get Your App Online in 30 Minutes

This guide will help you deploy the ATS Resume Optimizer for **FREE** with a shareable link.

## Overview

We'll use:
- **Render.com** (Free tier) - For hosting frontend and backend
- **MongoDB Atlas** (Free tier) - For database
- **Total Cost**: $0/month

You'll get a shareable link like: `https://your-app.onrender.com`

---

## Step 1: Prepare Your Code (5 minutes)

### 1.1 Push to GitHub

```bash
# Navigate to your project directory
cd ATS-Resume-Optimizer-main

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then push your code
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

**Important**: Make sure `.env` is in `.gitignore` (it already is in the provided files)

---

## Step 2: Set Up MongoDB Atlas (10 minutes)

### 2.1 Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free (use Google sign-in for faster setup)
3. Answer the welcome questions (select "I'm learning MongoDB")

### 2.2 Create Free Cluster
1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier
3. Choose a cloud provider (AWS recommended) and region (closest to you)
4. Cluster name: `ats-cluster` (or any name you like)
5. Click **"Create"**
6. Wait 1-3 minutes for cluster creation

### 2.3 Create Database User
1. You'll see "Security Quickstart"
2. Create a database user:
   - Username: `atsadmin` (or any username)
   - Password: Click "Autogenerate Secure Password" and **COPY IT**
   - Click **"Create User"**

### 2.4 Add IP Address
1. Under "Where would you like to connect from?"
2. Click **"Add My Current IP Address"**
3. Also add `0.0.0.0/0` to allow access from anywhere (needed for Render)
4. Click **"Finish and Close"**

### 2.5 Get Connection String
1. Click **"Connect"** on your cluster
2. Select **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://atsadmin:<password>@ats-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with the password you copied earlier
5. Add database name at the end: `...mongodb.net/ats_resume_optimizer?retryWrites=true&w=majority`

**Save this connection string** - you'll need it in Step 4!

---

## Step 3: Get Google Gemini API Key (5 minutes)

### 3.1 Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select "Create API key in new project" or use existing project
5. **Copy the API key** - you'll need it in Step 4!

---

## Step 4: Deploy to Render.com (10 minutes)

### 4.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (easier for deployment)

### 4.2 Deploy Backend Service

#### Create Backend Web Service
1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (authorize Render to access your repos)
3. Select your ATS repository
4. Configure the service:

   **Name**: `ats-backend`

   **Region**: Oregon (US West) or closest to you

   **Branch**: `main`

   **Root Directory**: `backend`

   **Runtime**: `Node`

   **Build Command**:
   ```bash
   npm install
   ```

   **Start Command**:
   ```bash
   node src/server.js
   ```

   **Plan**: `Free`

5. Click **"Advanced"** to add environment variables:

   Click **"Add Environment Variable"** for each:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | (paste your MongoDB connection string from Step 2.5) |
   | `GEMINI_API_KEY` | (paste your API key from Step 3) |
   | `CORS_ORIGIN` | `https://YOUR-FRONTEND-NAME.onrender.com` (we'll update this later) |

6. Click **"Create Web Service"**
7. Wait 5-10 minutes for build and deployment
8. **Copy the service URL** (e.g., `https://ats-backend.onrender.com`)

### 4.3 Deploy Frontend Static Site

#### Update Frontend API URL
Before deploying frontend, we need to tell it where the backend is:

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Select your repository again
3. Configure:

   **Name**: `ats-frontend`

   **Branch**: `main`

   **Root Directory**: `frontend`

   **Build Command**:
   ```bash
   npm install && npm run build
   ```

   **Publish Directory**:
   ```bash
   build
   ```

4. Click **"Advanced"** and add environment variable:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | (paste your backend URL from Step 4.2, e.g., `https://ats-backend.onrender.com`) |

5. Click **"Create Static Site"**
6. Wait 5-10 minutes for build and deployment
7. **This is your shareable link!** (e.g., `https://ats-frontend.onrender.com`)

### 4.4 Update Backend CORS
Now update the backend to accept requests from your frontend:

1. Go to your backend service in Render Dashboard
2. Click **"Environment"** in the left menu
3. Find `CORS_ORIGIN` variable
4. Update it to your frontend URL (e.g., `https://ats-frontend.onrender.com`)
5. Click **"Save Changes"**
6. Backend will automatically redeploy

---

## Step 5: Test Your Deployment (2 minutes)

1. Open your frontend URL: `https://ats-frontend.onrender.com`
2. Wait 30-60 seconds if you see "Service Unavailable" (first cold start)
3. Try uploading a job description
4. Try uploading a resume
5. Check if scoring works

### If something doesn't work:
- Check Render logs for both services
- Verify all environment variables are correct
- Make sure MongoDB connection string has the right password and database name

---

## Your Shareable Links

After deployment, you'll have:

- **Main App**: `https://ats-frontend.onrender.com` (share this!)
- **Backend API**: `https://ats-backend.onrender.com`
- **MongoDB**: Running on Atlas (not directly accessible)

---

## Important Notes About Free Tier

### Limitations:
1. **Cold Starts**: Services sleep after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Subsequent requests are instant

2. **Monthly Limits**: 750 hours per service
   - Enough for demos and low traffic
   - Resets every month

3. **Performance**: Shared resources
   - Good for demos, testing, portfolios
   - For production with traffic, upgrade to Starter plan ($7/month)

### Keeping Services Awake (Optional):
To avoid cold starts, you can use a free uptime monitor:
1. Go to [UptimeRobot](https://uptimerobot.com) (free)
2. Add your backend URL as a monitor
3. Set interval to 5 minutes
4. This pings your service to keep it awake

---

## Troubleshooting

### Frontend shows blank page
**Solution**:
1. Check browser console for errors
2. Verify `REACT_APP_API_URL` in Render frontend environment variables
3. Should be: `https://your-backend-name.onrender.com`

### "CORS Error" in browser
**Solution**:
1. Go to backend service in Render
2. Check `CORS_ORIGIN` environment variable
3. Should exactly match: `https://your-frontend-name.onrender.com`
4. No trailing slash!

### Database connection fails
**Solution**:
1. Check MongoDB Atlas cluster is running
2. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/ats_resume_optimizer?retryWrites=true&w=majority
   ```
3. Verify 0.0.0.0/0 is in IP whitelist (MongoDB Atlas → Network Access)

### Resume upload fails
**Solution**:
1. Check backend logs in Render
2. Verify Gemini API key is correct
3. File size limit is 10MB

### Backend shows "Service Unavailable"
**Wait 30-60 seconds** - Free tier has cold starts

---

## Upgrading (Optional)

If you need better performance or more traffic:

### Render Starter Plan ($7/month per service)
- No cold starts
- Always on
- Better for real users

**To Upgrade**:
1. Go to service in Render Dashboard
2. Click "Settings"
3. Under "Instance Type", select "Starter"
4. Click "Save Changes"

### MongoDB Upgrade ($57/month for M10)
Only needed if you exceed 512MB storage (free tier)

---

## Sharing Your App

Your app is now live! Share the link:
- **Production URL**: `https://ats-frontend.onrender.com`
- Use for: Portfolio, demos, client presentations, job applications

### Custom Domain (Optional, ~$12/year)
1. Buy domain from Namecheap, Google Domains, etc.
2. In Render Dashboard → Frontend Service → Settings
3. Click "Custom Domain"
4. Follow instructions to add DNS records
5. Your app will be at: `https://yourdomain.com`

---

## Monitoring Your App

### View Logs
1. Go to Render Dashboard
2. Click on a service
3. Click "Logs" tab
4. See real-time logs

### Check Status
- Green = Running
- Yellow = Deploying
- Red = Failed (check logs)

---

## Updating Your App

To deploy updates:

```bash
# Make your changes
git add .
git commit -m "Update feature"
git push origin main
```

Render will automatically:
1. Detect the push
2. Build and deploy
3. Update your live app (5-10 minutes)

---

## Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Render Backend | Free | $0/month |
| Render Frontend | Free | $0/month |
| MongoDB Atlas | M0 Free | $0/month |
| Domain (optional) | - | $12/year |
| **Total** | | **$0/month** |

---

## Next Steps

1. ✅ App is live with shareable link
2. Share with friends, on LinkedIn, in portfolio
3. Monitor usage and performance
4. Upgrade if needed when traffic grows
5. Add custom domain for professional look

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas
- **Gemini API Docs**: https://ai.google.dev/docs

---

## Security Checklist

- [ ] Never commit `.env` file to GitHub
- [ ] MongoDB IP whitelist includes 0.0.0.0/0
- [ ] Strong MongoDB password used
- [ ] Gemini API key is secret (in environment variables only)
- [ ] CORS is configured correctly

---

**Congratulations! Your app is live! 🎉**

Share your link: `https://your-app-name.onrender.com`
