import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import * as faceapi from 'face-api.js';
import { createCanvas, loadImage } from 'canvas';
import { ProcessingConfig } from '../../types';
import { SCHENGEN_PHOTO_REQUIREMENTS } from '../../constants';
import path from 'path';
import * as tf from '@tensorflow/tfjs';

// Load face-api models
const loadModels = async () => {
  try {
    const modelPath = path.join(process.cwd(), 'public', 'models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log('Models loaded successfully');
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
};

// Initialize models
let modelsLoaded = false;

export async function POST(req: NextRequest) {
  try {
    if (!modelsLoaded) {
      await loadModels();
      modelsLoaded = true;
    }

    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const config = JSON.parse(formData.get('config') as string) as ProcessingConfig;

    console.log('Received photo for processing. Size:', photo.size);
    console.log('Processing config:', config);

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    const buffer = await photo.arrayBuffer();
    console.log('Original photo size:', buffer.byteLength);
    
    const processedBuffer = await applyPhotoProcessing(Buffer.from(buffer), config);
    console.log('Processed photo size:', processedBuffer.length);

    // Log the dimensions of the processed image
    const processedImage = sharp(processedBuffer);
    const { width, height } = await processedImage.metadata();
    console.log('Processed image dimensions:', { width, height });

    const base64 = processedBuffer.toString('base64');
    const photoUrl = `data:image/jpeg;base64,${base64}`;

    // Create online submission version
    const onlineSubmissionBuffer = await createOnlineSubmissionVersion(processedBuffer);
    console.log('Online submission photo size:', onlineSubmissionBuffer.length);
    
    const onlineSubmissionBase64 = onlineSubmissionBuffer.toString('base64');
    const onlineSubmissionUrl = `data:image/jpeg;base64,${onlineSubmissionBase64}`;

    // For now, we'll return a placeholder for requirements
    const requirements = {
      size: true,
      background: true,
      headPosition: true,
      faceExpression: true,
    };

    return NextResponse.json({ photoUrl, onlineSubmissionUrl, requirements });
  } catch (error) {
    console.error('Photo processing failed:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

async function applyPhotoProcessing(buffer: Buffer, config: ProcessingConfig): Promise<Buffer> {
  let image = sharp(buffer);

  // Get the original image dimensions
  const metadata = await image.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  console.log('Original image dimensions:', { width: originalWidth, height: originalHeight });

  // Calculate the target dimensions based on the Schengen photo requirements
  const targetWidth = SCHENGEN_PHOTO_REQUIREMENTS.width * 10; // 350 pixels
  const targetHeight = SCHENGEN_PHOTO_REQUIREMENTS.height * 10; // 450 pixels

  if (config.fitFace) {
    try {
      const faceDetectionResult = await detectFace(buffer);
      if (faceDetectionResult) {
        image = await adjustFacePosition(image, faceDetectionResult.detection, faceDetectionResult.landmarks, targetWidth, targetHeight);
        console.log('Face detected and adjusted');
      } else {
        console.warn('No face detected. Proceeding with centered image.');
        image = await centerImage(image, targetWidth, targetHeight);
      }
    } catch (error) {
      console.error('Face detection failed:', error);
      image = await centerImage(image, targetWidth, targetHeight);
    }
  } else {
    image = await centerImage(image, targetWidth, targetHeight);
  }

  // Ensure light grey background
  image = image.flatten({ background: { r: 240, g: 240, b: 240 } });

  if (config.adjustContrast) {
    image = image.modulate({
      brightness: 1.05,
      saturation: 1.05,
      hue: 0
    });
  }

  // Sharpen the image slightly to improve clarity
  image = image.sharpen({ sigma: 0.5, m1: 0.5, m2: 0.5 });

  // Log final image dimensions
  const finalMetadata = await image.metadata();
  console.log('Final image dimensions:', { width: finalMetadata.width, height: finalMetadata.height });

  // Use higher quality JPEG compression
  return image.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
}

async function detectFace(imageBuffer: Buffer): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | null> {
  try {
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // Convert canvas to tensor
    const tensor = tf.browser.fromPixels(canvas as any);
    
    const detections = await faceapi.detectSingleFace(tensor as any).withFaceLandmarks();

    tensor.dispose();

    if (detections) {
      console.log('Face detected:', detections);
      return detections;
    } else {
      console.warn('No face detected in the image');
      return null;
    }
  } catch (error) {
    console.error('Error in face detection:', error);
    return null;
  }
}

async function adjustFacePosition(image: sharp.Sharp, detection: faceapi.FaceDetection, landmarks: faceapi.FaceLandmarks68, targetWidth: number, targetHeight: number) {
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error('Image dimensions not available');

  const faceBox = detection.box;
  const chin = landmarks.positions[8]; // Bottom of the chin
  const crown = landmarks.positions[24]; // Top of the forehead

  // Calculate current head height in pixels
  const currentHeadHeight = chin.y - crown.y;

  // Calculate desired head height (34mm is the middle of the allowed range)
  const desiredHeadHeight = (34 / 45) * targetHeight;

  // Calculate scale factor
  const scaleFactor = desiredHeadHeight / currentHeadHeight;

  // Calculate new dimensions
  const newWidth = Math.round(width * scaleFactor);
  const newHeight = Math.round(height * scaleFactor);

  // Calculate position to center the face
  const faceCenterX = faceBox.x + faceBox.width / 2;
  const faceCenterY = faceBox.y + faceBox.height / 2;

  const newFaceCenterX = faceCenterX * scaleFactor;
  const newFaceCenterY = faceCenterY * scaleFactor;

  const left = Math.max(0, Math.round(newFaceCenterX - targetWidth / 2));
  const top = Math.max(0, Math.round(newFaceCenterY - targetHeight * 0.45)); // Position face slightly above center

  // Resize the image
  image = image.resize({
    width: newWidth,
    height: newHeight,
    fit: 'fill'
  });

  // Crop the image to center the face
  return image.extract({
    left,
    top,
    width: targetWidth,
    height: targetHeight
  });
}

async function centerImage(image: sharp.Sharp, targetWidth: number, targetHeight: number) {
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error('Image dimensions not available');

  const aspectRatio = width / height;
  const targetAspectRatio = targetWidth / targetHeight;

  let resizeWidth, resizeHeight;
  if (aspectRatio > targetAspectRatio) {
    resizeHeight = targetHeight;
    resizeWidth = Math.round(targetHeight * aspectRatio);
  } else {
    resizeWidth = targetWidth;
    resizeHeight = Math.round(targetWidth / aspectRatio);
  }

  // Resize the image
  image = image.resize(resizeWidth, resizeHeight, { fit: 'fill' });

  // Calculate cropping parameters
  const left = Math.max(0, Math.round((resizeWidth - targetWidth) / 2));
  const top = Math.max(0, Math.round((resizeHeight - targetHeight) / 2));

  // Crop the image
  return image.extract({
    left,
    top,
    width: targetWidth,
    height: targetHeight
  });
}

async function createOnlineSubmissionVersion(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  
  // Resize to exactly 35x45mm at 300 DPI
  const width = Math.round(SCHENGEN_PHOTO_REQUIREMENTS.width * 300 / 25.4);
  const height = Math.round(SCHENGEN_PHOTO_REQUIREMENTS.height * 300 / 25.4);

  return image
    .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
    .toBuffer();
}