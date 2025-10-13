# Backend Dockerfile for ATS Resume Optimizer
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install

# Copy application files
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads/resumes uploads/jobs uploads/jd uploads/temp

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application from compiled dist folder
CMD ["node", "dist/server.js"]
