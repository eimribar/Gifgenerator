const validateConvertRequest = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No images provided. Please upload at least one image.'
    });
  }
  
  if (req.files.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Too many images. Maximum 50 images allowed.'
    });
  }
  
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 
    'image/gif', 'image/webp', 'image/bmp', 'image/tiff'
  ];
  
  for (const file of req.files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type: ${file.mimetype}`
      });
    }
  }
  
  // Validate GIF parameters
  if (req.body.quality) {
    const validQualities = ['low', 'medium', 'high', 'ultra'];
    if (!validQualities.includes(req.body.quality)) {
      return res.status(400).json({
        success: false,
        error: `Invalid quality. Must be one of: ${validQualities.join(', ')}`
      });
    }
  }
  
  next();
};

module.exports = { validateConvertRequest };
