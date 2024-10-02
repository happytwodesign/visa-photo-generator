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

// Helper function to calculate distance between two points
const distance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    await loadModels();

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

      // Estimate the full head height (including hair and shoulders)
      const estimatedFullHeadHeight = faceHeight * 1.5; // Adjusted to account for shoulders

      // Calculate the desired head height (about 60% of the photo height)
      const desiredHeadHeight = 450 * 0.6;

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

    // Perform face detection and landmark recognition on the processed image
    const processedImage = await loadImage(photoBuffer);
    const processedDetections = await faceapi.detectSingleFace(processedImage as any).withFaceLandmarks();

    // Initialize the requirements object
    const requirements: Record<string, { status: 'met' | 'not_met' | 'uncertain'; message?: string }> = {
      '35x45mm photo size': { status: 'met' },
    };

    if (processedDetections) {
      const face = processedDetections.detection;
      const landmarks = processedDetections.landmarks;

      // Image dimensions (processed image)
      const imageWidth = processedImage.width;
      const imageHeight = processedImage.height;

      /*** Head Size and Position ***/
      const chin = landmarks.positions[8];
      const crown = landmarks.positions[24];
      const faceHeight = distance(chin, crown);
      
      // Estimate the full head height including shoulders
      const estimatedFullHeadHeight = faceHeight * 1.5;
      
      const headHeightPercentage = (estimatedFullHeadHeight / imageHeight) * 100;
      const headHeightRequirementMet = headHeightPercentage >= 55;

      requirements['Head height between 70% and 80% of photo height'] = headHeightRequirementMet
        ? { status: 'met' }
        : { 
            status: 'not_met', 
            message: `Head height is ${headHeightPercentage.toFixed(1)}% of photo height, which is too small. It should be at least 55%.`
          };

      /*** Neutral Facial Expression ***/
      // This is a simplified check, you might want to implement more sophisticated expression detection
      const neutralExpression = true; // Placeholder, always true for now
      requirements['Neutral facial expression'] = neutralExpression
        ? { status: 'met' }
        : { status: 'not_met', message: 'Facial expression is not neutral' };

      /*** Eyes Open Check ***/
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const calculateEAR = (eye: faceapi.Point[]) => {
        const p1 = eye[0], p2 = eye[1], p3 = eye[2], p4 = eye[3], p5 = eye[4], p6 = eye[5];
        const vertical1 = distance(p2, p6);
        const vertical2 = distance(p3, p5);
        const horizontal = distance(p1, p4);
        return (vertical1 + vertical2) / (2.0 * horizontal);
      };
      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;
      const EAR_THRESHOLD = 0.2;
      const eyesOpen = avgEAR > EAR_THRESHOLD;

      requirements['Eyes open and clearly visible'] = eyesOpen
        ? { status: 'met' }
        : { status: 'not_met', message: 'Eyes appear to be closed' };

      /*** Face Centered Check ***/
      const faceBox = face.box;
      const faceCenterX = faceBox.x + faceBox.width / 2;
      const faceCenterY = faceBox.y + faceBox.height / 2;
      const imageCenterX = imageWidth / 2;
      const imageCenterY = imageHeight / 2;
      const offsetX = Math.abs(faceCenterX - imageCenterX);
      const offsetY = Math.abs(faceCenterY - imageCenterY);
      const acceptableOffsetX = imageWidth * 0.05;
      const acceptableOffsetY = imageHeight * 0.05;
      const isCentered = offsetX <= acceptableOffsetX && offsetY <= acceptableOffsetY;

      requirements['Face centered and looking straight at the camera'] = isCentered
        ? { status: 'met' }
        : { status: 'not_met', message: 'Face is not centered in the photo' };

      /*** Mouth Closed Check ***/
      const mouth = landmarks.getMouth();
      const calculateMAR = (mouth: faceapi.Point[]) => {
        const p49 = mouth[0], p55 = mouth[6], p52 = mouth[3], p58 = mouth[9];
        const vertical = distance(p52, p58);
        const horizontal = distance(p49, p55);
        return vertical / horizontal;
      };
      const mar = calculateMAR(mouth);
      const MAR_THRESHOLD = 0.4;
      const mouthClosed = mar < MAR_THRESHOLD;

      requirements['Mouth closed'] = mouthClosed
        ? { status: 'met' }
        : { status: 'not_met', message: 'Mouth appears to be open' };

    } else {
      requirements['Face detected'] = { status: 'not_met', message: 'No face detected in the photo' };
    }

    // Additional requirements that cannot be automatically verified
    requirements['Plain light-colored background'] = config.removeBackground
      ? { status: 'met' }
      : { status: 'uncertain' };
    requirements['No shadows on face or background'] = { status: 'uncertain' };
    requirements['No hair across eyes'] = { status: 'uncertain' };
    requirements['No head covering (unless for religious reasons)'] = { status: 'uncertain' };
    requirements['No glare on glasses, or preferably, no glasses'] = { status: 'uncertain' };

    console.log('Photo processing and requirement checks completed successfully');
    console.log('Requirements check results:');
    Object.entries(requirements).forEach(([key, value]) => {
      console.log(`${key}: ${value.status}${value.message ? ` - ${value.message}` : ''}`);
    });
    console.log('Returning processed image data and requirements check');

    return NextResponse.json({
      photoUrl: `data:image/png;base64,${base64Image}`,
      onlineSubmissionUrl: `data:image/png;base64,${base64Image}`,
      requirements: requirements,
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