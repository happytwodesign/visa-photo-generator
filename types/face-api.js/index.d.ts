import * as faceapi from 'face-api.js';

declare module 'face-api.js' {
  export function loadImage(url: string): Promise<HTMLImageElement>;
  
  export const env: {
    monkeyPatch: (options: any) => void;
  };

  export const nets: {
    ssdMobilenetv1: any;
    faceLandmark68Net: any;
    faceRecognitionNet: any;
    faceExpressionNet: any;
  };

  export class SsdMobilenetv1Options {}

  export function detectSingleFace(input: any): any;
  export function detectAllFaces(input: any, options?: any): any;
}