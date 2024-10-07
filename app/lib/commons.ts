import * as faceapi from 'face-api.js';
import { Canvas, Image, loadImage } from 'canvas';
import fs from 'fs';

// Polyfill for faceapi in Node environment
faceapi.env.monkeyPatch({ Canvas, Image } as any);

export const canvas = new Canvas(100, 100); // Create a canvas instance
export const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
export const faceDetectionOptions = new faceapi.SsdMobilenetv1Options();

export { loadImage }; // Export the loadImage function

export function saveFile(blob: Blob, filename: string) {
  if (!fs.existsSync('./out')) {
    fs.mkdirSync('./out');
  }
  
  fs.writeFileSync(`./out/${filename}`, blob as any);
}

export async function fetchImage(url: string): Promise<Image> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}