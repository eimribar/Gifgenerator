const { PDFDocument, PageSizes, rgb } = require('pdf-lib');
const sharp = require('sharp');

/**
 * High-Quality PDF Generation Service
 * Creates professional-grade PDFs from multiple images
 */
class PdfService {
  constructor() {
    this.pageSizes = {
      'A3': PageSizes.A3,
      'A4': PageSizes.A4,
      'A5': PageSizes.A5,
      'Letter': PageSizes.Letter,
      'Legal': PageSizes.Legal,
      'Tabloid': PageSizes.Tabloid,
      'Ledger': [PageSizes.Tabloid[1], PageSizes.Tabloid[0]],
      'Executive': [7.25 * 72, 10.5 * 72],
      'Comic': [6.625 * 72, 10.25 * 72], // Standard comic book size
      'Manga': [5 * 72, 7 * 72], // Standard manga size
      'Square': [8 * 72, 8 * 72],
      'Custom': null // Will be calculated based on first image
    };
  }

  /**
   * Create high-quality PDF from images
   * @param {Buffer[]} images - Array of image buffers
   * @param {Object} options - Configuration options
   * @returns {Buffer} - Generated PDF buffer
   */
  async createPdf(images, options = {}) {
    const {
      format = 'A4',
      quality = 95,
      margin = 0,
      optimize = true,
      metadata = {},
      compression = true
    } = options;

    console.log(`📄 Creating PDF: ${images.length} pages, ${format} format, quality: ${quality}`);

    try {
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Set metadata
      this.setMetadata(pdfDoc, metadata);
      
      // Get page size
      const pageSize = await this.getPageSize(format, images[0]);
      
      // Process each image
      for (let i = 0; i < images.length; i++) {
        console.log(`  Adding page ${i + 1}/${images.length}`);
        await this.addImagePage(pdfDoc, images[i], pageSize, quality, margin, optimize);
      }
      
      // Save PDF with optimization
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: compression,
        addDefaultPage: false,
        objectsPerTick: 200
      });
      
      const buffer = Buffer.from(pdfBytes);
      console.log(`✅ PDF created successfully (${Math.round(buffer.length / 1024)}KB)`);
      
      return buffer;
      
    } catch (error) {
      console.error('PDF creation error:', error);
      throw new Error(`Failed to create PDF: ${error.message}`);
    }
  }

  /**
   * Add image as a page in the PDF
   */
  async addImagePage(pdfDoc, imageBuffer, pageSize, quality, margin, optimize) {
    try {
      // Pre-process image for optimal PDF embedding
      let processedImage = imageBuffer;
      
      if (optimize) {
        // Optimize image for PDF
        processedImage = await this.optimizeImageForPdf(imageBuffer, pageSize, quality);
      }
      
      // Determine image type and embed accordingly
      let embeddedImage;
      const imageInfo = await sharp(processedImage).metadata();
      
      if (imageInfo.format === 'jpeg' || imageInfo.format === 'jpg') {
        embeddedImage = await pdfDoc.embedJpg(processedImage);
      } else if (imageInfo.format === 'png') {
        // Convert PNG to JPEG for better compression in PDF
        if (optimize) {
          const jpegBuffer = await sharp(processedImage)
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
          embeddedImage = await pdfDoc.embedJpg(jpegBuffer);
        } else {
          embeddedImage = await pdfDoc.embedPng(processedImage);
        }
      } else {
        // Convert other formats to JPEG
        const jpegBuffer = await sharp(processedImage)
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        embeddedImage = await pdfDoc.embedJpg(jpegBuffer);
      }
      
      // Add page with the specified size
      const page = pdfDoc.addPage(pageSize);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      // Calculate dimensions to fit image on page with margin
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      
      const imgDims = embeddedImage.scale(1);
      const widthRatio = availableWidth / imgDims.width;
      const heightRatio = availableHeight / imgDims.height;
      const scaleFactor = Math.min(widthRatio, heightRatio);
      
      const scaledWidth = imgDims.width * scaleFactor;
      const scaledHeight = imgDims.height * scaleFactor;
      
      // Center image on page
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;
      
      // Draw image on page
      page.drawImage(embeddedImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      // Add page number if multiple pages
      if (optimize) {
        this.addPageNumber(page, pdfDoc.getPageCount());
      }
      
    } catch (error) {
      console.error(`Error adding page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Optimize image for PDF embedding
   */
  async optimizeImageForPdf(imageBuffer, pageSize, quality) {
    const [pageWidth, pageHeight] = pageSize;
    
    // Calculate optimal resolution for PDF
    // PDF uses 72 DPI, but we'll use higher for quality
    const targetDPI = quality >= 90 ? 300 : quality >= 70 ? 200 : 150;
    const maxWidth = Math.round(pageWidth * targetDPI / 72);
    const maxHeight = Math.round(pageHeight * targetDPI / 72);
    
    // Process image
    const metadata = await sharp(imageBuffer).metadata();
    
    let pipeline = sharp(imageBuffer);
    
    // Only resize if image is larger than target
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3
      });
    }
    
    // Optimize based on quality setting
    if (quality >= 90) {
      // Ultra quality: minimal processing
      pipeline = pipeline
        .sharpen({ sigma: 0.5 })
        .withMetadata();
    } else if (quality >= 70) {
      // High quality: balanced optimization
      pipeline = pipeline
        .normalize()
        .withMetadata();
    } else {
      // Standard quality: aggressive optimization
      pipeline = pipeline
        .normalize()
        .removeAlpha();
    }
    
    return await pipeline.toBuffer();
  }

  /**
   * Get page size for PDF
   */
  async getPageSize(format, firstImage) {
    if (format === 'Custom' && firstImage) {
      // Calculate custom size based on first image
      const metadata = await sharp(firstImage).metadata();
      const aspectRatio = metadata.width / metadata.height;
      
      // Standard page height in points
      const pageHeight = 11 * 72; // 11 inches
      const pageWidth = pageHeight * aspectRatio;
      
      return [pageWidth, pageHeight];
    }
    
    return this.pageSizes[format] || PageSizes.A4;
  }

  /**
   * Set PDF metadata
   */
  setMetadata(pdfDoc, metadata) {
    const {
      title = 'Image Assembly PDF',
      author = 'Image Assembly API',
      subject = 'Generated PDF from images',
      keywords = ['pdf', 'images', 'conversion'],
      creator = 'Image Assembly API v2.0',
      producer = 'pdf-lib'
    } = metadata;
    
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(author);
    pdfDoc.setSubject(subject);
    pdfDoc.setKeywords(keywords);
    pdfDoc.setCreator(creator);
    pdfDoc.setProducer(producer);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }

  /**
   * Add page number to PDF page
   */
  addPageNumber(page, pageNumber) {
    try {
      const { height } = page.getSize();
      
      page.drawText(`${pageNumber}`, {
        x: page.getWidth() / 2 - 10,
        y: 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
    } catch (error) {
      // Silently fail if page numbering doesn't work
      console.debug('Could not add page number:', error.message);
    }
  }

  /**
   * Create a comic book style PDF with panels
   */
  async createComicPdf(images, options = {}) {
    const {
      panelsPerPage = 2,
      includeMargins = true,
      backgroundColor = { r: 255, g: 255, b: 255 }
    } = options;
    
    console.log(`📚 Creating comic-style PDF with ${panelsPerPage} panels per page`);
    
    // Use comic book page size
    const comicOptions = {
      ...options,
      format: 'Comic',
      margin: includeMargins ? 36 : 0 // 0.5 inch margins
    };
    
    // Group images into pages based on panels per page
    const groupedImages = [];
    for (let i = 0; i < images.length; i += panelsPerPage) {
      const pageImages = images.slice(i, i + panelsPerPage);
      
      // If we have multiple panels, combine them
      if (pageImages.length > 1 && panelsPerPage > 1) {
        const combinedImage = await this.combineImagesAsComicPage(pageImages, backgroundColor);
        groupedImages.push(combinedImage);
      } else {
        groupedImages.push(...pageImages);
      }
    }
    
    return this.createPdf(groupedImages, comicOptions);
  }

  /**
   * Combine multiple images into a comic page layout
   */
  async combineImagesAsComicPage(images, backgroundColor) {
    const pageWidth = 6.625 * 300; // Comic width at 300 DPI
    const pageHeight = 10.25 * 300; // Comic height at 300 DPI
    const margin = 50;
    const gutter = 20; // Space between panels
    
    // Calculate panel dimensions
    const panelWidth = (pageWidth - 2 * margin - gutter) / Math.min(images.length, 2);
    const panelHeight = (pageHeight - 2 * margin) / Math.ceil(images.length / 2);
    
    // Create composite image
    const composites = [];
    
    for (let i = 0; i < images.length; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      
      const x = margin + col * (panelWidth + gutter);
      const y = margin + row * panelHeight;
      
      // Resize image to fit panel
      const resizedImage = await sharp(images[i])
        .resize(Math.round(panelWidth), Math.round(panelHeight), {
          fit: 'contain',
          background: backgroundColor
        })
        .toBuffer();
      
      composites.push({
        input: resizedImage,
        top: Math.round(y),
        left: Math.round(x)
      });
    }
    
    // Create page with panels
    return await sharp({
      create: {
        width: Math.round(pageWidth),
        height: Math.round(pageHeight),
        channels: 3,
        background: backgroundColor
      }
    })
    .composite(composites)
    .jpeg({ quality: 95 })
    .toBuffer();
  }
}

module.exports = PdfService;