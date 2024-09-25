import * as faceapi from 'face-api.js';
import { Canvas, Image, loadImage } from 'canvas';
import fs from 'fs';

// Polyfill for faceapi in Node environment
faceapi.env.monkeyPatch({ Canvas, Image } as any);

export const canvas = new Canvas(100, 100); // Create a canvas instance
export const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
export const faceDetectionOptions = new faceapi.SsdMobilenetv1Options();

export { loadImage }; // Export the loadImage function

export function saveFile(fileName: string, buf: Buffer) {
  if (!fs.existsSync('./out')) {
    fs.mkdirSync('./out');
  }
  
  fs.writeFileSync(`./out/${fileName}`, buf);
}