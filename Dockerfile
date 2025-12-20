# JobTrack Backend Dockerfile for Render
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./

# Create data directories
RUN mkdir -p data export config services routes

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S jobtrack -u 1001

# Change ownership of the app directory
RUN chown -R jobtrack:nodejs /app
USER jobtrack

# Expose port (Render will set PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]
