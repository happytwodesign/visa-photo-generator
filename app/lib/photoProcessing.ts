import { ProcessingConfigType } from '../types';

export type ProcessingConfig = ProcessingConfigType;

export const defaultConfig: Omit<ProcessingConfig, 'photoRoomApiKey'> = {
  resize: true,
  removeBackground: true,
  changeBgToLightGray: true,
  fitHead: true,
  fixHeadTilt: true,
  adjustContrast: true,
};

export async function processPhoto(photo: File, config: ProcessingConfig) {
  const formData = new FormData();
  formData.append('photo', photo);
  formData.append('config', JSON.stringify(config));

  const response = await fetch('/api/process-photo', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process photo');
  }

  return response.json();
}