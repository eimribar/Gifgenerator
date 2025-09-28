# 🎨 Image Assembly API

**Convert multiple images to ultra-high-quality animated GIFs or PDFs!**

Perfect for creating comic books, presentations, or any sequential visual content.

## ✨ Features

- 🎬 **Ultra-Quality GIF Generation** with ffmpeg
- 📄 **PDF Creation** from multiple images  
- 🚀 **Handles 50+ images** at once
- 💾 **Automatic cloud storage** (S3 optional)
- ⚡ **Production-ready** with Docker

## 🚀 Quick Start

### Deploy to Render (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### API Endpoints

```bash
# Convert to GIF (Ultra Quality)
POST /api/convert/gif

# Convert to PDF  
POST /api/convert/pdf

# Convert to Both
POST /api/convert/both
```

### Example Usage

```bash
curl -X POST https://your-api.onrender.com/api/convert/both \
  -F "images=@comic1.png" \
  -F "images=@comic2.png" \
  -F "images=@comic3.png" \
  -F "delay=1500" \
  -F "quality=ultra"
```

## 🎯 Perfect For

- Comic book creators
- Social media content
- Educational materials  
- Marketing presentations
- Any multi-image projects

## 📊 Specifications

- **Max images**: 50 per request
- **Max file size**: 50MB per image
- **Quality modes**: low, medium, high, ultra
- **Output formats**: GIF, PDF, or both
- **Processing timeout**: 10 minutes

## 🛠 Tech Stack

- Node.js + Express
- Sharp (image processing)
- ffmpeg (GIF generation)
- pdf-lib (PDF creation)
- Docker (containerization)

## 📝 License

MIT - Use freely for any project!