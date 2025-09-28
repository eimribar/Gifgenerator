FROM node:18-alpine

# Install system dependencies for ultra-quality image processing
RUN apk add --no-cache \
  ffmpeg \
  imagemagick \
  python3 \
  make \
  g++ \
  vips-dev \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with better error handling
RUN npm ci --production || npm install --production

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads temp output outputs

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
CMD ["node", "server.js"]