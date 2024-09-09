import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { removeBackgroundFromImageBase64 } from "remove.bg";
import { ProcessingConfig } from '../../types';
import { SCHENGEN_PHOTO_REQUIREMENTS } from '../../constants';

// You'll need to set your Remove.bg API key as an environment variable
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const photo = formData.get('photo') as File;
  const config = JSON.parse(formData.get('config') as string) as ProcessingConfig;

  if (!photo) {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  }

  try {
    const buffer = await photo.arrayBuffer();
    const processedBuffer = await applyPhotoProcessing(Buffer.from(buffer), config);

    const base64 = processedBuffer.toString('base64');
    const photoUrl = `data:image/jpeg;base64,${base64}`;

    const requirements = await checkCompliance(photoUrl);

    return NextResponse.json({ photoUrl, requirements });
  } catch (error) {
    console.error('Photo processing failed:', error);
    return NextResponse.json({ error: 'Photo processing failed' }, { status: 500 });
  }
}

async function applyPhotoProcessing(buffer: Buffer, config: ProcessingConfig): Promise<Buffer> {
  let image = sharp(buffer);

  if (config.resize) {
    image = image.resize({
      width: SCHENGEN_PHOTO_REQUIREMENTS.width,
      height: SCHENGEN_PHOTO_REQUIREMENTS.height,
      fit: 'cover',
      position: 'top',
    });
  }

  if (config.removeBackground) {
    if (!REMOVE_BG_API_KEY) {
      console.error('Remove.bg API key is not set');
      // Fallback to original image if API key is not set
    } else {
      try {
        const base64img = buffer.toString('base64');
        const result = await removeBackgroundFromImageBase64({
          base64img,
          apiKey: REMOVE_BG_API_KEY,
          size: 'regular',
          type: 'person',
        });
        image = sharp(Buffer.from(result.base64img, 'base64'));
      } catch (error) {
        console.error('Background removal failed:', error);
        // Fallback to the original image if background removal fails
      }
    }
  }

  if (config.changeBackgroundColor) {
    image = image.flatten({ background: { r: 255, g: 255, b: 255 } });
  }

  if (config.fitFace) {
    console.log('Face fitting would be applied here');
    // Implement face detection and cropping logic here
  }

  if (config.fixHeadTilt) {
    console.log('Head tilt correction would be applied here');
    // Implement head tilt correction logic here
  }

  if (config.adjustContrast) {
    image = image.modulate({
      brightness: 1,
      saturation: 1.1,
      hue: 0
    });
  }

  return image.jpeg().toBuffer();
}

async function checkCompliance(photoUrl: string) {
  // Implement compliance checking logic here
  return {
    size: true,
    background: true,
    headPosition: true,
    faceExpression: true,
  };
}