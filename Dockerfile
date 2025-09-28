FROM node:18-alpine

# Install ffmpeg and imagemagick for GIF generation
RUN apk add --no-cache \
  ffmpeg \
  imagemagick \
  python3 \
  make \
  g++ \
  vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --production

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p outputs temp

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]