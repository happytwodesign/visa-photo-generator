import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import * as faceapi from 'face-api.js';
import path from 'path';
import { Canvas, Image, loadImage } from 'canvas';

// Polyfill for faceapi in Node environment
faceapi.env.monkeyPatch({ Canvas, Image } as any);

let modelsLoaded = false;

// Load face-api models
async function loadModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(process.cwd(), 'public', 'models');
  try {
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
}

// Load models when the file is first imported
loadModels().catch(console.error);

export async function GET(request: NextRequest) {
  console.log('GET request received, but job processing is no longer supported');
  return NextResponse.json({ error: 'Job processing is no longer supported' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  console.log('Running latest version of process-photo route');
  try {
    console.log('Received POST request for photo processing');
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const config = JSON.parse(formData.get('config') as string);

    if (!photo || !config) {
      return NextResponse.json({ error: 'Missing photo or configuration' }, { status: 400 });
    }

    const photoRoomApiKey = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;

    if (!photoRoomApiKey) {
      console.error('PhotoRoom API key is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('Step 1: Resizing image to 35x45 ratio');
    let buffer = await photo.arrayBuffer();
    let image = sharp(Buffer.from(buffer));
    
    // Get image metadata
    const metadata = await image.metadata();
    const aspectRatio = metadata.width! / metadata.height!;
    const targetAspectRatio = 35 / 45;

    if (aspectRatio > targetAspectRatio) {
      // Image is wider, crop the width
      const newWidth = Math.round(metadata.height! * targetAspectRatio);
      image = image.extract({ left: Math.round((metadata.width! - newWidth) / 2), top: 0, width: newWidth, height: metadata.height! });
    } else {
      // Image is taller, crop the height
      const newHeight = Math.round(metadata.width! / targetAspectRatio);
      image = image.extract({ left: 0, top: Math.round((metadata.height! - newHeight) / 2), width: metadata.width!, height: newHeight });
    }

    image = image.resize(350, 450, { fit: 'fill' });

    console.log('Step 2: Fitting head to meet height requirement');
    const inputBuffer = await image.toBuffer();
    const img = await loadImage(inputBuffer);
    const detections = await faceapi.detectSingleFace(img as any).withFaceLandmarks();

    if (detections) {
      console.log('Face detected, adjusting image...');
      // Implement face detection and image adjustment code here
    } else {
      console.warn('No face detected. Proceeding with center crop.');
      // The image is already cropped to the correct aspect ratio
    }

    let photoBuffer = await image.toBuffer();

    if (config.removeBackground) {
      console.log('Step 3: Removing background using PhotoRoom API');
      const photoRoomFormData = new FormData();
      photoRoomFormData.append('image_file', photoBuffer, {
        filename: 'image.png',
        contentType: 'image/png',
      });

      try {
        const photoRoomResponse = await axios.post('https://sdk.photoroom.com/v1/segment', photoRoomFormData, {
          headers: {
            ...photoRoomFormData.getHeaders(),
            'x-api-key': photoRoomApiKey,
          },
          responseType: 'arraybuffer',
        });

        console.log('Background removed successfully');
        image = sharp(photoRoomResponse.data);
        image = image.resize(350, 450, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } });
        photoBuffer = await image.toBuffer();
      } catch (photoRoomError) {
        console.error('PhotoRoom API Error:', photoRoomError);
        return NextResponse.json({ error: 'Failed to remove background' }, { status: 500 });
      }
    }

    console.log('Converting processed image to base64');
    const base64Image = photoBuffer.toString('base64');

    return NextResponse.json({
      photoUrl: `data:image/png;base64,${base64Image}`,
    });

  } catch (error) {
    console.error('Error processing photo:', error);
    if (error instanceof Error) {
      console.error(error.stack);
      return NextResponse.json({ error: 'Failed to process photo', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to process photo' }, { status: 500 });
  }
}
