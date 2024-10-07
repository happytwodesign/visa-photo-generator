import { NextResponse } from 'next/server';
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
const loadModels = async () => {
  if (modelsLoaded) return;
  
  console.log('Loading face-api models...');
  const modelsPath = path.join(process.cwd(), 'public', 'models');
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
};

export async function POST(request: Request) {
  try {
    console.log('Received POST request for photo processing');
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const config = JSON.parse(formData.get('config') as string);

    await loadModels();

    const photoRoomApiKey = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;

    if (!photoRoomApiKey) {
      console.error('PhotoRoom API key is not set');
      return NextResponse.json({ error: 'PhotoRoom API key is not set' }, { status: 500 });
    }

    console.log('Step 1: Resizing image to 35x45 ratio');
    let buffer = await photo.arrayBuffer();
    let image = sharp(Buffer.from(buffer));
    image = image.resize(350, 450, { fit: 'cover' });

    console.log('Step 2: Fitting head to meet height requirement');
    const inputBuffer = await image.toBuffer();
    const img = await loadImage(inputBuffer);
    const detections = await faceapi.detectSingleFace(img as any).withFaceLandmarks();

    if (detections) {
      console.log('Face detected. Adjusting image...');
      const face = detections.detection;
      const landmarks = detections.landmarks;
      const chin = landmarks.positions[8];
      const crown = landmarks.positions[24];

      // Calculate the face height (from chin to crown)
      const faceHeight = Math.abs(crown.y - chin.y);

      // Estimate the full head height (including hair and extra padding)
      const estimatedFullHeadHeight = faceHeight * 1.6; // Increased from 1.4 to account for more hair and padding

      // Calculate the desired head height (60% of the photo height)
      const desiredHeadHeight = 450 * 0.6;

      // Calculate the scale factor
      const scale = desiredHeadHeight / estimatedFullHeadHeight;

      // Calculate new dimensions, ensuring they are positive and large enough
      const newWidth = Math.max(350, Math.round(img.width * scale));
      const newHeight = Math.max(450, Math.round(img.height * scale));

      // Calculate position to center the face and leave more space at the top
      const faceCenter = {
        x: (face.box.left + face.box.right) / 2,
        y: crown.y - (estimatedFullHeadHeight * 0.25) // Increased from 0.15 to 0.25 to add more top padding
      };

      // Calculate crop area, ensuring the face is centered and there's more space at the top
      const cropLeft = Math.max(0, Math.min(newWidth - 350, Math.round((faceCenter.x * scale) - 175)));
      const cropTop = Math.max(0, Math.min(newHeight - 450, Math.round((faceCenter.y * scale) - 90))); // Increased from 67.5 to 90 (20% of 450)

      console.log(`Face center: (${faceCenter.x}, ${faceCenter.y})`);
      console.log(`Resizing to ${newWidth}x${newHeight}`);
      console.log(`Cropping to 350x450 from left: ${cropLeft}, top: ${cropTop}`);

      image = image.resize(newWidth, newHeight);
      image = image.extract({ 
        left: cropLeft,
        top: cropTop,
        width: 350,
        height: 450 
      });
      console.log('Image adjusted to fit head height requirement');
    } else {
      console.warn('No face detected. Proceeding with center crop.');
      // If no face is detected, center crop the image
      const metadata = await image.metadata();
      const cropLeft = Math.max(0, Math.round(((metadata.width as number) - 350) / 2));
      const cropTop = Math.max(0, Math.round(((metadata.height as number) - 450) / 2));
      image = image.extract({ 
        left: cropLeft,
        top: cropTop,
        width: 350,
        height: 450 
      });
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
        throw new Error('Failed to remove background');
      }
    }

    console.log('Converting processed image to base64');
    const base64Image = photoBuffer.toString('base64');

    return NextResponse.json({
      photoUrl: `data:image/png;base64,${base64Image}`,
    });

  } catch (error) {
    console.error('Error processing photo:', error);
    return NextResponse.json({ error: 'Failed to process photo' }, { status: 500 });
  }
}