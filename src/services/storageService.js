const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

/**
 * Storage Service for S3 and Local File System
 */
class StorageService {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    // Check for AWS credentials
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.bucket = process.env.S3_BUCKET || 'image-assembly-outputs';
      this.useS3 = true;
      console.log('✅ S3 storage configured');
    } else {
      this.useS3 = false;
      this.localOutputDir = path.join(process.cwd(), 'outputs');
      console.log('📁 Using local storage at:', this.localOutputDir);
    }
  }

  async upload(buffer, format, filename) {
    const finalFilename = filename || `${uuidv4()}.${format}`;
    
    if (this.useS3) {
      return await this.uploadToS3(buffer, finalFilename, format);
    } else {
      return await this.uploadToLocal(buffer, finalFilename, format);
    }
  }

  async uploadToS3(buffer, filename, format) {
    const key = `${format}/${filename}`;
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: format === 'gif' ? 'image/gif' : 'application/pdf',
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000',
      Metadata: {
        'created-by': 'image-assembly-api',
        'format': format
      }
    };
    
    try {
      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  async uploadToLocal(buffer, filename, format) {
    try {
      const formatDir = path.join(this.localOutputDir, format);
      await fs.mkdir(formatDir, { recursive: true });
      
      const filepath = path.join(formatDir, filename);
      await fs.writeFile(filepath, buffer);
      
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      return `${baseUrl}/outputs/${format}/${filename}`;
    } catch (error) {
      console.error('Local storage error:', error);
      throw new Error(`Failed to save file locally: ${error.message}`);
    }
  }

  async downloadImage(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to download image from ${url}: ${error.message}`);
    }
  }
}

module.exports = StorageService;