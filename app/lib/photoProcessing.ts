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

  try {
    const response = await fetch('/api/process-photo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process photo: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    } else {
      throw new Error("Received non-JSON response from server");
    }
  } catch (error) {
    console.error('Error in processPhoto:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}