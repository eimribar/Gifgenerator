# 🚀 Deploy Image Assembly API to Render

## Quick Deploy Steps:

### 1. Create GitHub Repository

```bash
# First, create a new repository on GitHub.com
# Name it: image-assembly-api

# Then in your terminal:
git init
git add .
git commit -m "Initial commit: Image Assembly API with ultra-quality GIF support"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/image-assembly-api.git
git push -u origin main
```

### 2. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `image-assembly-api`
   - **Environment**: `Docker` (uses our Dockerfile)
   - **Instance Type**: Start with free, upgrade if needed
   
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   # Optional AWS S3 (if you have credentials):
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   S3_BUCKET=your-bucket
   ```

6. Click "Create Web Service"

### 3. Your API will be live at:
```
https://image-assembly-api.onrender.com
```

### 4. Test with Emma Images:

```bash
# Convert all Emma @ Bonttera images
curl -X POST https://image-assembly-api.onrender.com/api/convert/both \
  -F "images=@image1.png" \
  -F "images=@image2.png" \
  ... (all 10+ images) \
  -F "delay=1500" \
  -F "width=800" \
  -F "height=1200" \
  -F "quality=ultra"
```

## Why Render is Perfect:

- ✅ **No file size limits** (unlike local)
- ✅ **Automatic scaling** for large files
- ✅ **Free tier available**
- ✅ **Automatic HTTPS**
- ✅ **Docker support** for ffmpeg
- ✅ **10-minute timeout** (perfect for large GIFs)

## Production Features:

- Handles 50+ images at once
- Ultra-quality GIF generation with ffmpeg
- 200MB request size limit
- Automatic S3 upload (if configured)
- Health monitoring at `/health`