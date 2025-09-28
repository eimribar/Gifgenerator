const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Ultra High-Quality GIF Generation Service
 * Supports multiple backends: FFmpeg (primary), ImageMagick (secondary), Sharp (fallback)
 */
class GifService {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.checkDependencies();
  }

  async checkDependencies() {
    try {
      const { stdout } = await execAsync('which ffmpeg');
      this.ffmpegPath = stdout.trim() || '/opt/homebrew/bin/ffmpeg' || '/usr/local/bin/ffmpeg';
      console.log('✅ FFmpeg found at:', this.ffmpegPath);
    } catch {
      this.ffmpegPath = null;
      console.log('⚠️ FFmpeg not found - using fallback methods');
    }

    try {
      await execAsync('which convert');
      this.hasImageMagick = true;
      console.log('✅ ImageMagick found');
    } catch {
      this.hasImageMagick = false;
    }
  }

  /**
   * Main GIF creation method with ultra-high quality
   * @param {Buffer[]} images - Array of image buffers
   * @param {Object} options - Configuration options
   * @returns {Buffer} - Generated GIF buffer
   */
  async createGif(images, options = {}) {
    const {
      width = 800,
      height = 1200,
      delay = 2000,
      loop = 0,
      quality = 'ultra' // 'low', 'medium', 'high', 'ultra'
    } = options;

    console.log(`🎬 Creating GIF: ${images.length} frames, ${width}x${height}, quality: ${quality}`);

    // Quality presets optimized for different use cases
    const qualityPresets = {
      low: { 
        colors: 64, 
        dither: 'FloydSteinberg', 
        effort: 3,
        compressionLevel: 9,
        method: 'fast'
      },
      medium: { 
        colors: 128, 
        dither: 'FloydSteinberg', 
        effort: 5,
        compressionLevel: 6,
        method: 'balanced'
      },
      high: { 
        colors: 256, 
        dither: 'FloydSteinberg', 
        effort: 8,
        compressionLevel: 3,
        method: 'quality'
      },
      ultra: { 
        colors: 256, 
        dither: 'none', 
        effort: 10,
        compressionLevel: 0,
        method: 'maximum'
      }
    };

    const preset = qualityPresets[quality] || qualityPresets.ultra;

    // Create unique temp directory for this conversion
    const sessionId = uuidv4();
    const tempDir = path.join(this.tempDir, sessionId);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Pre-process frames for maximum quality
      const processedFrames = await this.preprocessFrames(images, width, height, preset);
      
      // Save frames to temp directory
      const frameFiles = await this.saveFramesToDisk(processedFrames, tempDir);
      
      // Try different GIF generation methods in order of quality
      let gifBuffer;
      
      if (this.ffmpegPath) {
        gifBuffer = await this.createGifWithFFmpeg(frameFiles, tempDir, width, height, delay, loop, preset);
      } else if (this.hasImageMagick) {
        gifBuffer = await this.createGifWithImageMagick(frameFiles, tempDir, delay, loop, preset);
      } else {
        gifBuffer = await this.createGifWithSharp(frameFiles[0], preset);
      }

      console.log(`✅ GIF created successfully (${Math.round(gifBuffer.length / 1024)}KB)`);
      return gifBuffer;

    } finally {
      // Cleanup temp files
      await this.cleanup(tempDir);
    }
  }

  /**
   * Preprocess frames for optimal quality
   */
  async preprocessFrames(images, width, height, preset) {
    const processedFrames = [];
    
    for (let i = 0; i < images.length; i++) {
      console.log(`  Processing frame ${i + 1}/${images.length}`);
      
      // Use Sharp for high-quality image processing
      let sharpInstance = sharp(images[i]);
      
      // Get metadata for smart processing
      const metadata = await sharpInstance.metadata();
      
      // Apply optimal resize strategy
      const resizeOptions = {
        width,
        height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3, // Best quality resize kernel
        withoutEnlargement: false
      };
      
      // Process based on quality preset
      let processed = sharpInstance.resize(resizeOptions);
      
      // Apply quality-specific optimizations
      if (preset.method === 'maximum') {
        // Ultra quality: preserve maximum detail
        processed = processed
          .sharpen({ sigma: 0.5 }) // Subtle sharpening
          .modulate({
            brightness: 1.0,
            saturation: 1.1, // Slightly boost colors
            hue: 0
          });
      } else if (preset.method === 'quality') {
        // High quality: balance between quality and file size
        processed = processed.normalize(); // Auto-optimize levels
      }
      
      // Convert to high-quality PNG for intermediate storage
      const buffer = await processed
        .png({
          compressionLevel: preset.compressionLevel,
          quality: 100,
          effort: preset.effort
        })
        .toBuffer();
      
      processedFrames.push(buffer);
    }
    
    return processedFrames;
  }

  /**
   * Save frames to disk for external processing
   */
  async saveFramesToDisk(frames, tempDir) {
    const files = [];
    
    for (let i = 0; i < frames.length; i++) {
      const filename = `frame_${String(i).padStart(4, '0')}.png`;
      const filepath = path.join(tempDir, filename);
      await fs.writeFile(filepath, frames[i]);
      files.push(filepath);
    }
    
    return files;
  }

  /**
   * Create GIF using FFmpeg (highest quality method)
   */
  async createGifWithFFmpeg(frameFiles, tempDir, width, height, delay, loop, preset) {
    console.log('  Using FFmpeg for ultra-quality GIF generation...');
    
    const pattern = path.join(tempDir, 'frame_%04d.png');
    const outputPath = path.join(tempDir, 'output.gif');
    const fps = Math.round(1000 / delay);
    
    if (preset.method === 'maximum') {
      // Ultra quality: Two-pass method for optimal palette
      const paletteFile = path.join(tempDir, 'palette.png');
      
      // Pass 1: Generate optimal palette
      const paletteCmd = `${this.ffmpegPath} -framerate ${fps} -i "${pattern}" -vf "fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen=max_colors=${preset.colors}:stats_mode=full:transparency_color=ffffff" -y "${paletteFile}"`;
      await execAsync(paletteCmd, { maxBuffer: 1024 * 1024 * 100 });
      
      // Pass 2: Create GIF using optimal palette
      const gifCmd = `${this.ffmpegPath} -framerate ${fps} -i "${pattern}" -i "${paletteFile}" -filter_complex "[0:v]fps=${fps},scale=${width}:${height}:flags=lanczos[scaled];[scaled][1:v]paletteuse=dither=none:bayer_scale=0:diff_mode=rectangle:new=1" -loop ${loop} -y "${outputPath}"`;
      await execAsync(gifCmd, { maxBuffer: 1024 * 1024 * 100 });
      
    } else {
      // Standard quality: Single pass
      const dither = preset.dither === 'none' ? 'none' : 'floyd_steinberg';
      const gifCmd = `${this.ffmpegPath} -framerate ${fps} -i "${pattern}" -vf "fps=${fps},scale=${width}:${height}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${preset.colors}[p];[s1][p]paletteuse=dither=${dither}" -loop ${loop} -y "${outputPath}"`;
      await execAsync(gifCmd, { maxBuffer: 1024 * 1024 * 100 });
    }
    
    return await fs.readFile(outputPath);
  }

  /**
   * Create GIF using ImageMagick (good quality fallback)
   */
  async createGifWithImageMagick(frameFiles, tempDir, delay, loop, preset) {
    console.log('  Using ImageMagick for GIF generation...');
    
    const outputPath = path.join(tempDir, 'output.gif');
    const delayInCentiseconds = Math.round(delay / 10);
    
    let command = `convert -delay ${delayInCentiseconds} -loop ${loop}`;
    command += ` -colors ${preset.colors}`;
    command += ` -dither ${preset.dither}`;
    command += preset.method === 'maximum' ? ' -quality 100' : ' -quality 90';
    command += ` ${frameFiles.join(' ')}`;
    command += preset.method !== 'maximum' ? ' -layers Optimize' : '';
    command += ` "${outputPath}"`;
    
    await execAsync(command, { maxBuffer: 1024 * 1024 * 100 });
    return await fs.readFile(outputPath);
  }

  /**
   * Create static GIF using Sharp (emergency fallback)
   */
  async createGifWithSharp(firstFrame, preset) {
    console.log('  ⚠️ Using Sharp fallback (static GIF only)...');
    
    return await sharp(firstFrame)
      .gif({
        colors: preset.colors,
        effort: preset.effort,
        dither: preset.dither !== 'none' ? 1.0 : 0.0,
        force: true
      })
      .toBuffer();
  }

  /**
   * Clean up temporary files
   */
  async cleanup(tempDir) {
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file));
      }
      await fs.rmdir(tempDir);
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }
}

module.exports = GifService;