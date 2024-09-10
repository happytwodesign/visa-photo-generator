import { ProcessingConfig } from '../types';
import { removeBackground } from './backgroundRemoval';

export const defaultConfig: ProcessingConfig = {
  resize: true,
  removeBackground: true, // Set to true by default
  fitFace: true,
  fixHeadTilt: false,
  adjustContrast: true,
};

export async function processPhoto(photo: File, config: ProcessingConfig) {
  let processedPhoto = photo;

  console.log('Starting photo processing with config:', config);

  if (config.removeBackground) {
    try {
      console.log('Attempting to remove background...');
      const backgroundRemovedBlob = await removeBackground(photo);
      processedPhoto = new File([backgroundRemovedBlob], 'processed.png', { type: 'image/png' });
      console.log('Background removed successfully. New file size:', processedPhoto.size);
    } catch (error) {
      console.error('Background removal failed:', error);
      // Proceed with the original photo if background removal fails
    }
  } else {
    console.log('Background removal skipped');
  }

  const formData = new FormData();
  formData.append('photo', processedPhoto);
  formData.append('config', JSON.stringify(config));

  console.log('Sending request to process-photo API...');
  const response = await fetch('/api/process-photo', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Server response:', errorText);
    throw new Error('Failed to process photo');
  }

  const result = await response.json();
  console.log('Received response from process-photo API:', result);

  return result;
}