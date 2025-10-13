# ATS Resume Optimizer - Deployment Guide

This guide covers multiple deployment options for the ATS Resume Optimizer application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment (Recommended)](#docker-deployment-recommended)
- [Render.com Deployment](#rendercom-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment Testing](#post-deployment-testing)

## Prerequisites

- Node.js 18+ (for local builds)
- Docker & Docker Compose (for containerized deployment)
- MongoDB instance (local or cloud like MongoDB Atlas)
- Google Gemini API Key
- Git

## Deployment Options

### 1. Docker Deployment (Recommended)

This is the easiest way to deploy the entire stack.

#### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd ATS-Resume-Optimizer-main
```

#### Step 2: Set Up Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password

# API Keys
GEMINI_API_KEY=your_gemini_api_key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Frontend API URL
REACT_APP_API_URL=http://localhost:5000
```

#### Step 3: Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (caution: deletes data)
docker-compose down -v
```

The application will be available at:
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### 2. Render.com Deployment

Deploy the application to Render.com using the provided `render.yaml` configuration.

#### Step 1: Prerequisites
- Create a [Render.com](https://render.com) account
- Set up a MongoDB Atlas cluster (free tier available)

#### Step 2: Connect Repository
1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

#### Step 3: Configure Environment Variables
In Render dashboard, set these environment variables for the backend service:
- `MONGODB_URI`: Your MongoDB connection string
- `GEMINI_API_KEY`: Your Google Gemini API key
- `NODE_ENV`: production
- `PORT`: 5000

For the frontend service:
- `REACT_APP_API_URL`: Your backend service URL (e.g., https://ats-backend.onrender.com)

#### Step 4: Deploy
Render will automatically build and deploy your services. This may take 5-10 minutes.

### 3. Manual Deployment

#### Backend Deployment

```bash
cd backend

# Install dependencies
npm install --production

# Set environment variables
export MONGODB_URI="your_mongodb_connection_string"
export GEMINI_API_KEY="your_api_key"
export PORT=5000
export NODE_ENV=production

# Start the server
node src/server.js

# Or use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name ats-backend
pm2 save
pm2 startup
```

#### Frontend Deployment

```bash
cd frontend

# Install dependencies
npm install

# Set API URL
export REACT_APP_API_URL="https://your-backend-url.com"

# Build the application
npm run build

# Serve with a static server (e.g., serve, nginx, apache)
npm install -g serve
serve -s build -l 3000
```

## Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://username:password@host:port/database

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-api-url.com
```

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP or use 0.0.0.0/0 for all IPs (less secure)
5. Get your connection string
6. Replace `<password>` and `<dbname>` in the connection string

### Option 2: Local MongoDB (Development)
```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/data/directory
```

## SSL/HTTPS Configuration

For production deployments:
1. **Render.com**: Automatically provides SSL certificates
2. **Docker with Nginx**: Use Let's Encrypt with certbot
3. **Manual**: Configure your reverse proxy (nginx/apache) with SSL

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple backend instances behind a load balancer
- Use MongoDB replica sets for high availability
- Implement Redis for session management and caching

### File Storage
For production with multiple instances:
- Use AWS S3, Google Cloud Storage, or Azure Blob Storage for resume uploads
- Update backend to use cloud storage instead of local file system

## Monitoring and Logging

### Recommended Tools
- **Application Monitoring**: New Relic, Datadog, or PM2 Plus
- **Error Tracking**: Sentry
- **Log Management**: Loggly, Papertrail, or ELK Stack
- **Uptime Monitoring**: UptimeRobot, Pingdom

### Health Check Endpoints
- Backend: `GET /api/health`
- Database: Check MongoDB connection in logs

## Backup Strategy

### Database Backups
```bash
# Manual backup
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/path

# Restore
mongorestore --uri="mongodb://username:password@host:port/database" /backup/path
```

### Automated Backups
- MongoDB Atlas: Automatic continuous backups
- Docker: Use volume backups with cron jobs
- Cloud providers: Use built-in backup services

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` in backend matches your frontend URL
   - Check browser console for specific CORS error messages

2. **Database Connection Fails**
   - Verify MongoDB URI is correct
   - Check network connectivity
   - Ensure MongoDB server is running

3. **File Upload Issues**
   - Check `uploads` directory permissions
   - Verify disk space is available
   - Check file size limits in nginx/server config

4. **API Not Responding**
   - Check if backend server is running
   - Verify PORT is not already in use
   - Check firewall settings

### Logs

```bash
# Docker logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# PM2 logs
pm2 logs ats-backend

# System logs
tail -f /var/log/nginx/error.log
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **Database**: Use strong passwords and restrict network access
4. **Updates**: Keep dependencies updated (`npm audit fix`)
5. **HTTPS**: Always use SSL/TLS in production
6. **Input Validation**: Server-side validation is implemented
7. **Rate Limiting**: Consider adding rate limiting to API endpoints

## Performance Optimization

1. **Frontend**:
   - Enable gzip compression (configured in nginx.conf)
   - Implement code splitting
   - Use CDN for static assets

2. **Backend**:
   - Implement caching (Redis)
   - Database indexing
   - Connection pooling

3. **Database**:
   - Add indexes on frequently queried fields
   - Regular maintenance and optimization

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Open an issue on GitHub

## License

Include your license information here.
