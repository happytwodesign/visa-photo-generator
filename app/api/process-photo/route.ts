import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ProcessingConfig } from '../../types';
import { SCHENGEN_PHOTO_REQUIREMENTS } from '../../constants';

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

  // Remove the background removal step for now
  // if (config.removeBackground) {
  //   image = image.removeAlpha().threshold(240);
  // }

  if (config.changeBackgroundColor) {
    // Instead of flattening, let's just add a white background
    image = image.composite([{
      input: Buffer.from([255, 255, 255, 255]), // White background
      raw: {
        width: 1,
        height: 1,
        channels: 4
      },
      tile: true,
      blend: 'dest-over'
    }]);
  }

  if (config.fitFace) {
    console.log('Face fitting would be applied here');
  }

  if (config.fixHeadTilt) {
    console.log('Head tilt correction would be applied here');
  }

  if (config.adjustContrast) {
    // Adjust contrast slightly
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