const express = require('express');
const multer = require('multer');
const router = express.Router();
const GifService = require('../services/gifService');
const PdfService = require('../services/pdfService');
const StorageService = require('../services/storageService');
const { validateConvertRequest } = require('../middleware/validation');

// Configure multer for large file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 50 // Max 50 images
  }
});

const gifService = new GifService();
const pdfService = new PdfService();
const storageService = new StorageService();

// Convert to GIF endpoint
router.post('/gif', upload.array('images', 50), validateConvertRequest, async (req, res, next) => {
  try {
    const { delay = 2000, loop = 0, width = 800, height = 1200, quality = 'ultra' } = req.body;
    
    const images = req.files.map(file => file.buffer);
    
    const gifBuffer = await gifService.createGif(images, {
      delay: parseInt(delay),
      loop: parseInt(loop),
      width: parseInt(width),
      height: parseInt(height),
      quality
    });
    
    const url = await storageService.upload(gifBuffer, 'gif');
    
    res.json({
      success: true,
      format: 'gif',
      url,
      size: gifBuffer.length,
      frames: images.length,
      settings: { delay, loop, width, height, quality }
    });
  } catch (error) {
    next(error);
  }
});

// Convert to PDF endpoint
router.post('/pdf', upload.array('images', 50), validateConvertRequest, async (req, res, next) => {
  try {
    const { format = 'A4', quality = 95, optimize = true } = req.body;
    
    const images = req.files.map(file => file.buffer);
    
    const pdfBuffer = await pdfService.createPdf(images, {
      format,
      quality: parseInt(quality),
      optimize: optimize === 'true' || optimize === true
    });
    
    const url = await storageService.upload(pdfBuffer, 'pdf');
    
    res.json({
      success: true,
      format: 'pdf',
      url,
      size: pdfBuffer.length,
      pages: images.length,
      settings: { format, quality }
    });
  } catch (error) {
    next(error);
  }
});

// Convert to both GIF and PDF
router.post('/both', upload.array('images', 50), validateConvertRequest, async (req, res, next) => {
  try {
    const images = req.files.map(file => file.buffer);
    
    const [gifBuffer, pdfBuffer] = await Promise.all([
      gifService.createGif(images, {
        delay: parseInt(req.body.delay || 2000),
        width: parseInt(req.body.width || 800),
        height: parseInt(req.body.height || 1200),
        quality: req.body.quality || 'ultra'
      }),
      pdfService.createPdf(images, {
        format: req.body.format || 'A4',
        quality: parseInt(req.body.pdfQuality || 95)
      })
    ]);
    
    const [gifUrl, pdfUrl] = await Promise.all([
      storageService.upload(gifBuffer, 'gif'),
      storageService.upload(pdfBuffer, 'pdf')
    ]);
    
    res.json({
      success: true,
      gif: {
        url: gifUrl,
        size: gifBuffer.length,
        frames: images.length
      },
      pdf: {
        url: pdfUrl,
        size: pdfBuffer.length,
        pages: images.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Convert from URLs
router.post('/from-urls', async (req, res, next) => {
  try {
    const { imageUrls, outputFormat = 'both', ...options } = req.body;
    
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({ success: false, error: 'imageUrls array is required' });
    }
    
    const images = await Promise.all(
      imageUrls.map(url => storageService.downloadImage(url))
    );
    
    let result = { success: true };
    
    if (outputFormat === 'gif' || outputFormat === 'both') {
      const gifBuffer = await gifService.createGif(images, options);
      const gifUrl = await storageService.upload(gifBuffer, 'gif');
      result.gif = { url: gifUrl, size: gifBuffer.length };
    }
    
    if (outputFormat === 'pdf' || outputFormat === 'both') {
      const pdfBuffer = await pdfService.createPdf(images, options);
      const pdfUrl = await storageService.upload(pdfBuffer, 'pdf');
      result.pdf = { url: pdfUrl, size: pdfBuffer.length };
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
