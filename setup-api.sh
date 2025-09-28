#!/bin/bash

echo "🚀 Setting up Image Assembly API..."

# Create all necessary directories
mkdir -p src/routes src/services src/middleware src/utils outputs temp

# Create .env.example
cat > .env.example << 'ENVEOF'
PORT=3000
NODE_ENV=development

# Optional: AWS S3 Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=
ENVEOF

echo "✅ Setup complete! Ready to deploy to GitHub and Render."
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. Run: git init && git add . && git commit -m 'Initial commit'"
echo "3. Push to GitHub"
echo "4. Deploy to Render.com"
