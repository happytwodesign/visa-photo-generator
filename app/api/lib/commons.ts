import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';

export const canvas = new Canvas(100, 100); // Adjust size as needed
export const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
export const faceDetectionOptions = new faceapi.SsdMobilenetv1Options();

export const saveFile = (blob: Blob, filename: string) => {
  // This function might not be needed in the API route
  console.warn('saveFile function called in server-side code');
};

export async function fetchImage(url: string): Promise<Image> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}