import { ProcessingConfig } from '../types';

export async function processPhoto(file: File, config: ProcessingConfig) {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('config', JSON.stringify(config));

  const response = await fetch('/api/process-photo', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Photo processing failed');
  }

  return await response.json();
}

export const defaultConfig: ProcessingConfig = {
  resize: true,
  removeBackground: true,
  changeBackgroundColor: true,
  fitFace: true,
  fixHeadTilt: true,
  adjustContrast: true,
};