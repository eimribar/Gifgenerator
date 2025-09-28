# 🚀 Deployment Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Name it: `image-assembly-api`
3. Make it public
4. Don't initialize with README (we already have one)
5. Create repository

## Step 2: Push to GitHub

Run these commands in your terminal:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/image-assembly-api.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render.com

### Option A: Quick Deploy (Recommended)

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select your `image-assembly-api` repository
5. Use these settings:
   - **Name**: image-assembly-api
   - **Runtime**: Docker
   - **Instance Type**: Standard (at least 2GB RAM)
   - **Region**: Choose closest to you
6. Click "Create Web Service"

### Option B: Using render.yaml

1. The repository includes a `render.yaml` file
2. Go to https://dashboard.render.com/blueprints
3. Click "New Blueprint Instance"
4. Connect your repository
5. Render will automatically use the configuration

## Step 4: Configure Environment Variables (Optional)

If you want to use AWS S3 for storage:

1. In Render dashboard, go to your service
2. Click "Environment" tab
3. Add these variables:
   - `STORAGE_TYPE`: `s3`
   - `AWS_ACCESS_KEY_ID`: Your AWS key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret
   - `AWS_REGION`: `us-east-1`
   - `S3_BUCKET_NAME`: Your bucket name

## Step 5: Test Your Deployment

Once deployed, your API will be available at:
```
https://image-assembly-api.onrender.com
```

Test it with:
```bash
curl https://image-assembly-api.onrender.com/api/health
```

## 📝 Important Notes

- **Free tier limitations**: Render's free tier spins down after 15 minutes of inactivity
- **Recommended**: Use Standard instance ($7/month) for production
- **Storage**: Files are stored locally by default (temporary on Render)
- **For permanent storage**: Configure S3 or use a persistent disk

## 🎉 Success!

Your API is now live! Access the documentation at:
```
https://image-assembly-api.onrender.com/api/docs
```

## Need Help?

- Check logs in Render dashboard
- Ensure Docker build completes
- Verify environment variables
- Check the health endpoint first