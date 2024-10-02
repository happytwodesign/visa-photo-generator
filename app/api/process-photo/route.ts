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

// Update existing helper functions
const calculateBrightness = (pixel: { r: number; g: number; b: number }) => {
  return (0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b);
};

const calculateAverageBrightness = (brightnessValues: number[]) => {
  const sum = brightnessValues.reduce((acc, val) => acc + val, 0);
  return sum / brightnessValues.length;
};

const calculateBrightnessStdDev = (brightnessValues: number[], mean: number) => {
  const variance =
    brightnessValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    brightnessValues.length;
  return Math.sqrt(variance);
};

// Update the getPixelsInPolygon function
const getPixelsInPolygon = async (polygon: faceapi.Point[], photoBuffer: Buffer) => {
  const { data, info } = await sharp(photoBuffer).raw().toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const isInside = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi + xi));
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const pixels = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (isInside(x, y)) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        pixels.push({ r, g, b });
      }
    }
  }
  return pixels;
};

const calculateVariance = (pixels: { r: number; g: number; b: number }[]) => {
  const brightnessValues = pixels.map(p => (p.r + p.g + p.b) / 3);
  const mean = brightnessValues.reduce((sum, val) => sum + val, 0) / brightnessValues.length;
  const variance = brightnessValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / brightnessValues.length;
  return variance;
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

      // Head height check
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
      const leftEyePoints = landmarks.getLeftEye();
      const rightEyePoints = landmarks.getRightEye();
      const calculateEAR = (eyePoints: faceapi.Point[]) => {
        const [p1, p2, p3, p4, p5, p6] = eyePoints;
        const vertical1 = distance(p2, p6);
        const vertical2 = distance(p3, p5);
        const horizontal = distance(p1, p4);
        return (vertical1 + vertical2) / (2.0 * horizontal);
      };
      const leftEAR = calculateEAR(leftEyePoints);
      const rightEAR = calculateEAR(rightEyePoints);
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

      // Calculate the percentage of offset from the center
      const offsetXPercentage = Math.abs(faceCenterX - imageCenterX) / (imageWidth / 2) * 100;
      const offsetYPercentage = Math.abs(faceCenterY - imageCenterY) / (imageHeight / 2) * 100;

      // Log offset percentages
      console.log('Face Centering Check:');
      console.log(`Offset X: ${offsetXPercentage.toFixed(2)}%, Offset Y: ${offsetYPercentage.toFixed(2)}%`);

      // Define thresholds for different states
      const goodOffsetPercentage = 20;
      const warningOffsetPercentage = 25;

      // Check centering
      let centeringStatus: 'met' | 'warning' | 'not_met';
      if (offsetXPercentage <= goodOffsetPercentage && offsetYPercentage <= goodOffsetPercentage) {
        centeringStatus = 'met';
      } else if (offsetXPercentage <= warningOffsetPercentage && offsetYPercentage <= warningOffsetPercentage) {
        centeringStatus = 'warning';
      } else {
        centeringStatus = 'not_met';
      }

      // Check if the face is looking straight (using eye positions and nose position)
      const leftEyeCenter = landmarks.getLeftEye()[0];
      const rightEyeCenter = landmarks.getRightEye()[3];
      const nose = landmarks.getNose()[0];

      // Calculate horizontal eye angle
      const eyeAngleHorizontal = Math.abs(Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * (180 / Math.PI));

      // Calculate vertical eye angle (using nose position)
      const eyeMidpointY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const eyeNoseAngleVertical = Math.abs(Math.atan2(nose.y - eyeMidpointY, nose.x - ((leftEyeCenter.x + rightEyeCenter.x) / 2)) * (180 / Math.PI));

      // Log angle calculations
      console.log('Face Angle Check:');
      console.log(`Horizontal Eye Angle: ${eyeAngleHorizontal.toFixed(2)}°, Vertical Eye-Nose Angle: ${eyeNoseAngleVertical.toFixed(2)}°`);

      const goodHorizontalAngleThreshold = 10;
      const warningHorizontalAngleThreshold = 15;

      // New thresholds for vertical angle
      const goodVerticalAngleMin = 85;
      const goodVerticalAngleMax = 95;
      const warningVerticalAngleMin = 75;
      const warningVerticalAngleMax = 105;

      let lookingStraightStatus: 'met' | 'warning' | 'not_met';
      if (eyeAngleHorizontal < goodHorizontalAngleThreshold && 
          eyeNoseAngleVertical >= goodVerticalAngleMin && eyeNoseAngleVertical <= goodVerticalAngleMax) {
        lookingStraightStatus = 'met';
      } else if (eyeAngleHorizontal < warningHorizontalAngleThreshold && 
                 eyeNoseAngleVertical >= warningVerticalAngleMin && eyeNoseAngleVertical <= warningVerticalAngleMax) {
        lookingStraightStatus = 'warning';
      } else {
        lookingStraightStatus = 'not_met';
      }

      // Log final status
      console.log('Final Face Position Status:');
      console.log(`Centering Status: ${centeringStatus}, Looking Straight Status: ${lookingStraightStatus}`);

      // Combine centering and looking straight checks
      let faceCenteredAndStraightStatus: 'met' | 'warning' | 'not_met';
      if (centeringStatus === 'met' && lookingStraightStatus === 'met') {
        faceCenteredAndStraightStatus = 'met';
      } else if (centeringStatus === 'not_met' && lookingStraightStatus === 'not_met') {
        faceCenteredAndStraightStatus = 'not_met';
      } else {
        faceCenteredAndStraightStatus = 'warning';
      }

      requirements['Face centered and looking straight at the camera'] = {
        status: faceCenteredAndStraightStatus,
        message: faceCenteredAndStraightStatus === 'met'
          ? ''
          : faceCenteredAndStraightStatus === 'warning'
          ? 'Face might not be perfectly centered or looking straight'
          : centeringStatus === 'not_met'
          ? 'Face is not centered in the photo'
          : 'Face is not looking straight at the camera'
      } as { status: 'met' | 'not_met' | 'uncertain'; message?: string };

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

      /*** No Hair Covers the Eyes and Face ***/
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const faceContour = [
        ...landmarks.getJawOutline(),
        ...landmarks.getLeftEyeBrow(),
        ...landmarks.getRightEyeBrow()
      ];

      let eyesClear = true;
      let eyeStdDevs = [];

      for (const eye of [leftEye, rightEye]) {
        const eyePixels = await getPixelsInPolygon(eye, photoBuffer);
        const brightnessValues = eyePixels.map(calculateBrightness);
        const eyeBrightnessStdDev = calculateBrightnessStdDev(brightnessValues, calculateAverageBrightness(brightnessValues));
        eyeStdDevs.push(eyeBrightnessStdDev);
        const EYE_STDDEV_THRESHOLD = 5;

        if (eyeBrightnessStdDev > EYE_STDDEV_THRESHOLD) {
          eyesClear = false;
          break;
        }
      }

      const faceContourPixels = await getPixelsInPolygon(faceContour, photoBuffer);
      const faceContourBrightnessValues = faceContourPixels.map(calculateBrightness);
      const faceContourBrightnessStdDev = calculateBrightnessStdDev(faceContourBrightnessValues, calculateAverageBrightness(faceContourBrightnessValues));
      const FACE_CONTOUR_STDDEV_THRESHOLD = 10;

      const hairCoveringFace = faceContourBrightnessStdDev > FACE_CONTOUR_STDDEV_THRESHOLD;

      const noHairAcrossEyesAndFace = eyesClear && !hairCoveringFace;
      requirements['No hair across eyes and the face'] = {
        status: noHairAcrossEyesAndFace ? 'met' : 'not_met',
        message: noHairAcrossEyesAndFace ? '' : 'Hair may be covering the eyes or parts of the face'
      };

      console.log('No Hair Covers the Eyes and Face Check:');
      console.log(`Left Eye StdDev: ${eyeStdDevs[0]?.toFixed(2)}, Right Eye StdDev: ${eyeStdDevs[1]?.toFixed(2)}`);
      console.log(`Eye StdDev Threshold: ${EYE_STDDEV_THRESHOLD}`);
      console.log(`Face Contour Brightness StdDev: ${faceContourBrightnessStdDev.toFixed(2)}`);
      console.log(`Face Contour StdDev Threshold: ${FACE_CONTOUR_STDDEV_THRESHOLD}`);
      console.log(`No Hair Across Eyes and Face: ${noHairAcrossEyesAndFace}`);

      /*** No Shadows on Face or Background ***/
      // Get face landmarks to define the face region
      const faceLandmarks = landmarks.positions;

      // Get pixels within the face region
      const facePixels = await getPixelsInPolygon(faceLandmarks, photoBuffer);

      // Calculate brightness values for face pixels
      const faceBrightnessValues = facePixels.map(calculateBrightness);

      // Calculate mean brightness of the face
      const faceMeanBrightness = calculateAverageBrightness(faceBrightnessValues);

      // Calculate brightness standard deviation for face
      const faceBrightnessStdDev = calculateBrightnessStdDev(faceBrightnessValues, faceMeanBrightness);

      // Threshold for acceptable brightness variation (adjust based on testing)
      const FACE_SHADOW_STDDEV_THRESHOLD = 40; // Adjust this value

      // Determine if shadows are present on the face
      const shadowsOnFace = faceBrightnessStdDev > FACE_SHADOW_STDDEV_THRESHOLD;
      // Get background pixels
      const backgroundPixels = await getPixelsInPolygon(faceLandmarks, photoBuffer);

      let shadowsOnBackground = false;
      let backgroundBrightnessStdDev = 0;

      if (backgroundPixels.length >= 100) {
        // Calculate brightness values for background pixels
        const backgroundBrightnessValues = backgroundPixels.map(calculateBrightness);

        // Calculate mean brightness of the background
        const backgroundMeanBrightness = calculateAverageBrightness(backgroundBrightnessValues);

        // Calculate brightness standard deviation for background
        backgroundBrightnessStdDev = calculateBrightnessStdDev(backgroundBrightnessValues, backgroundMeanBrightness);

        // Threshold for acceptable brightness variation (adjust based on testing)
        const BACKGROUND_SHADOW_STDDEV_THRESHOLD = 25; // Adjust this value

        // Determine if shadows are present on the background
        shadowsOnBackground = backgroundBrightnessStdDev > BACKGROUND_SHADOW_STDDEV_THRESHOLD;
      }

      // Combine the shadow checks
      const noShadows = !shadowsOnFace && !shadowsOnBackground;

      requirements['No shadows on face or background'] = noShadows
        ? { status: 'met' }
        : { 
            status: 'not_met', 
            message: shadowsOnFace && shadowsOnBackground
              ? 'Shadows detected on both face and background'
              : shadowsOnFace
              ? 'Shadows detected on the face'
              : 'Shadows detected on the background'
          };

      // Log for debugging
      console.log('Shadows Check:');
      console.log(`Face Brightness StdDev: ${faceBrightnessStdDev.toFixed(2)}`);
      console.log(`Face Shadow StdDev Threshold: ${FACE_SHADOW_STDDEV_THRESHOLD}`);
      console.log(`Background Brightness StdDev: ${backgroundBrightnessStdDev.toFixed(2)}`);
      console.log(`Background Shadow StdDev Threshold: ${BACKGROUND_SHADOW_STDDEV_THRESHOLD}`);
      console.log(`No Shadows: ${noShadows}`);

    } else {
      requirements['Face detected'] = { status: 'not_met', message: 'No face detected in the photo' };
    }

    // Additional requirements that cannot be automatically verified
    requirements['No head covering (unless for religious reasons)'] = { status: 'uncertain' };
    requirements['No glare on glasses, or preferably, no glasses'] = { status: 'uncertain' };
    requirements['Plain light-colored background'] = config.removeBackground
      ? { status: 'met' }
      : { status: 'uncertain' };

    // Update logging for debugging
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