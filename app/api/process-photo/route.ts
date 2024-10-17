import { NextRequest, NextResponse } from 'next/server';
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
async function loadModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(process.cwd(), 'public', 'models');
  try {
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
}

// Load models when the file is first imported
loadModels().catch(console.error);

export async function GET(request: NextRequest) {
  console.log('GET request received, but job processing is no longer supported');
  return NextResponse.json({ error: 'Job processing is no longer supported' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  console.log('Server: Received POST request for photo processing');
  try {
    const formData = await request.formData();
    console.log('Server: FormData received');

    const photo = formData.get('photo') as File;
    if (!photo) {
      throw new Error('No photo provided');
    }
    console.log('Server: Original photo size:', photo.size, 'bytes');

    console.log('Server: Sending request to external API...');
    const externalApiResponse = await fetch('http://167.99.227.46:3002/process-photo', {
      method: 'POST',
      body: formData,
    });

    console.log('Server: External API response status:', externalApiResponse.status);

    if (!externalApiResponse.ok) {
      const errorText = await externalApiResponse.text();
      console.error('Server: External API error details:', errorText);
      throw new Error(`External API error: ${externalApiResponse.status} - ${errorText}`);
    }

    const data = await externalApiResponse.json();
    console.log('Server: Processed data received from external API');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server: Error processing photo:', error);
    // Return a more detailed error message
    return NextResponse.json(
      { 
        error: 'Failed to process photo', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
