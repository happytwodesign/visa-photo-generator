import { ProcessingConfig } from '../types';

export const defaultConfig: ProcessingConfig = {
  resize: true,
  removeBackground: false,
  fitFace: true,
  fixHeadTilt: false,
  adjustContrast: true,
};

export async function processPhoto(photo: File, config: ProcessingConfig) {
  const formData = new FormData();
  formData.append('photo', photo);
  formData.append('config', JSON.stringify(config));

  console.log('Original photo size:', photo.size);

  const response = await fetch('/api/process-photo', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process photo');
  }

  const result = await response.json();
  
  console.log('API response:', result);

  // Check if the photoUrl is a base64 string and log its length
  if (result.photoUrl && result.photoUrl.startsWith('data:image/jpeg;base64,')) {
    const base64 = result.photoUrl.split(',')[1];
    console.log('Processed photo base64 length:', base64.length);
  }

  return result;
}