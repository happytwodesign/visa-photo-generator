import sharp from 'sharp';
import { ProcessingConfigType } from '../types';

const TARGET_WIDTH = 413; // Width for 35mm at 300 DPI
const TARGET_HEIGHT = 531; // Height for 45mm at 300 DPI

export async function processPhoto(inputBuffer: Buffer, config: ProcessingConfigType): Promise<Buffer> {
  let image = sharp(inputBuffer, { failOnError: false });
  
  // Preserve metadata and color profiles
  image = image.keepMetadata().withMetadata();

  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to determine image dimensions');
  }

  // Resize to 35x45mm at 300 DPI if needed, maintaining aspect ratio
  if (metadata.width !== TARGET_WIDTH || metadata.height !== TARGET_HEIGHT) {
    image = image.resize({
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharp.kernel.lanczos3, // High-quality resampling
    });
  }

  // Adjust contrast if requested
  if (config.adjustContrast) {
    image = image.modulate({ brightness: 1.05, saturation: 1.05 });
  }

  // Change background to light gray if requested
  if (config.changeBgToLightGray) {
    image = image.flatten({ background: '#F0F0F0' });
  }

  // Apply very minimal sharpening
  image = image.sharpen({
    sigma: 0.8,
    m1: 0.3,
    m2: 0.5,
    x1: 6,
    y2: 20,
    y3: 40,
  });

  // Process the image and return the buffer as PNG
  return await image.png({ 
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: true
  }).toBuffer();
}

// Keep the upscaleImage function for potential future use
export async function upscaleImage(inputBuffer: Buffer): Promise<Buffer> {
  // ... (keep the existing upscaleImage function)
}

// Add other server-side processing functions here