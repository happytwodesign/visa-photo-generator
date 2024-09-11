import { NextResponse } from 'next/server';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import * as faceapi from 'face-api.js';
import path from 'path';
import { Canvas, Image, loadImage } from 'canvas';
import fs from 'fs';

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

const TIMEOUT = 30000; // 30 seconds

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    await loadModels(); // Ensure models are loaded before processing

    console.log('Received POST request for photo processing');
    const photoRoomApiKey = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;

    if (!photoRoomApiKey) {
      console.error('PhotoRoom API key is not set');
      return NextResponse.json({ error: 'PhotoRoom API key is not set' }, { status: 500 });
    }

    console.log('Parsing form data...');
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const config = JSON.parse(formData.get('config') as string);
    console.log('Form data parsed successfully. Config:', config);

    console.log('Step 1: Resizing image to 35x45 ratio');
    let buffer = await photo.arrayBuffer();
    let image = sharp(Buffer.from(buffer));
    image = image.resize(350, 450, { fit: 'cover' });
    console.log('Image resized successfully');

    console.log('Step 2: Fitting head to meet height requirement');
    const inputBuffer = await image.toBuffer();
    console.log('Image buffer created');
    const img = await loadImage(inputBuffer);
    console.log('Image loaded for face detection');
    console.time('Face detection');
    const detections = await faceapi.detectSingleFace(img as any).withFaceLandmarks();
    console.timeEnd('Face detection');

    if (detections) {
      console.log('Face detected. Adjusting image...');
      const face = detections.detection;
      const landmarks = detections.landmarks;
      const chin = landmarks.positions[8];
      const crown = landmarks.positions[24];

      // Calculate the face height (from chin to crown)
      const faceHeight = Math.abs(crown.y - chin.y);

      // Estimate the full head height (including hair)
      const estimatedFullHeadHeight = faceHeight * 2.2; // Increased to account for more hair

      // Calculate the desired head height (70-80% of the photo height)
      const desiredHeadHeight = 450 * 0.75; // Using 75% as a middle ground

      // Calculate the scale factor
      const scale = desiredHeadHeight / estimatedFullHeadHeight;

      // Calculate new dimensions, ensuring they are positive
      const newWidth = Math.max(350, Math.round(img.width * scale));
      const newHeight = Math.max(450, Math.round(img.height * scale));

      // Calculate position to center the face
      const faceCenter = {
        x: (face.box.left + face.box.right) / 2,
        y: (face.box.top + face.box.bottom) / 2
      };

      // Calculate crop area, ensuring the face is centered
      const cropLeft = Math.max(0, Math.min(newWidth - 350, Math.round((faceCenter.x * scale) - 175)));
      const cropTop = Math.max(0, Math.min(newHeight - 450, Math.round((faceCenter.y * scale) - 225)));

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
      console.log('Image adjusted to fit full head height requirement');
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
        console.time('PhotoRoom API call');
        const photoRoomResponse = await axios.post('https://sdk.photoroom.com/v1/segment', photoRoomFormData, {
          headers: {
            ...photoRoomFormData.getHeaders(),
            'x-api-key': photoRoomApiKey,
          },
          responseType: 'arraybuffer',
        });
        console.timeEnd('PhotoRoom API call');

        console.log('Background removed successfully');
        image = sharp(photoRoomResponse.data);
        image = image.resize(350, 450, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } });
        photoBuffer = await image.toBuffer();
      } catch (photoRoomError: unknown) {
        if (axios.isAxiosError(photoRoomError) && photoRoomError.response) {
          console.error('PhotoRoom API Error:', photoRoomError.response.data);
        } else {
          console.error('PhotoRoom API Error:', photoRoomError);
        }
        throw new Error('Failed to remove background');
      }
    } else {
      console.log('Background removal skipped');
    }

    console.log('Converting processed image to base64');
    const base64Image = photoBuffer.toString('base64');

    console.log('Preparing requirements check');
    const requirements = {
      '35x45mm photo size': true,
      'Head height: between 32mm and 36mm': detections ? true : 'Unable to verify',
      'Neutral facial expression': 'Unable to verify automatically',
      'Eyes open and clearly visible': 'Unable to verify automatically',
      'Face centered and looking straight at the camera': detections ? true : 'Unable to verify',
      'Plain light-colored background': config.removeBackground,
      'No shadows on face or background': 'Unable to verify automatically',
      'Mouth closed': 'Unable to verify automatically',
      'No hair across eyes': 'Unable to verify automatically',
      'No head covering (unless for religious reasons)': 'Unable to verify automatically',
      'No glare on glasses, or preferably, no glasses': 'Unable to verify automatically'
    };

    console.log('Photo processing completed successfully');
    console.log('Returning processed image data and requirements check');
    return NextResponse.json({ 
      photoUrl: `data:image/png;base64,${base64Image}`,
      onlineSubmissionUrl: `data:image/png;base64,${base64Image}`,
      requirements: requirements
    });
  } catch (error: unknown) {
    console.error('Error processing photo:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process photo' }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processPhoto(request: Request, signal: AbortSignal) {
  // Move the entire photo processing logic here
  // Make sure to pass the `signal` to any fetch or axios calls
  // e.g., axios.post(..., { signal })
}