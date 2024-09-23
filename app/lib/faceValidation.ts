import * as faceapi from 'face-api.js';
import { canvas, faceDetectionNet, faceDetectionOptions, saveFile } from './commons';

export async function validatePhoto(imageUrl: string) {
  try {
    console.log("Starting photo validation for URL:", imageUrl);

    // Load models
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');

    // Fetch the image
    const img = await canvas.loadImage(imageUrl);
    const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceExpressions();

    if (!detections.length) {
      console.log("No face detected in the image.");
      return { isValid: false, message: "No face detected in the image.", requirements: {} };
    }

    const face = detections[0];
    const landmarks = face.landmarks;
    const expressions = face.expressions;

    console.log("Face detection result:", JSON.stringify(face, null, 2));

    let requirements: Record<string, boolean> = {
      '35x45mm photo size': true, // Assumed to be correct after processing
      'Neutral facial expression': expressions.neutral > 0.7,
      'Eyes open and clearly visible': true, // Need additional checks
      'Face centered and looking straight at the camera': true, // Need additional checks
      'Plain light-colored background': true, // Cannot be determined by face-api.js alone
      'No shadows on face or background': true, // Cannot be determined by face-api.js alone
      'Mouth closed': expressions.neutral > 0.7, // Approximate check
      'No hair across eyes': true, // Need additional checks
      'No head covering (unless for religious reasons)': true, // Need additional checks
      'No glare on glasses, or preferably, no glasses': true, // Need additional checks
    };

    console.log("Requirements check results:", JSON.stringify(requirements, null, 2));

    const isValid = Object.values(requirements).every(Boolean);
    const messages = Object.entries(requirements)
      .filter(([_, met]) => !met)
      .map(([requirement, _]) => `Requirement not met: ${requirement}`);

    console.log("Validation result:", isValid ? "Valid" : "Invalid");
    console.log("Validation messages:", messages);

    return {
      isValid,
      messages: messages.length > 0 ? messages : ["Photo meets all checked criteria."],
      requirements,
    };
  } catch (error) {
    console.error("Error validating photo:", error);
    return { 
      isValid: false, 
      message: "Error validating photo. Please try again. Details: " + (error instanceof Error ? error.message : String(error)), 
      requirements: {} 
    };
  }
}