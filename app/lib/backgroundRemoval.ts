import axios from 'axios';

const PHOTOROOM_API_KEY = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;

export async function removeBackground(imageFile: File): Promise<Blob> {
  console.log('Starting background removal...');

  const formData = new FormData();
  formData.append('image_file', imageFile);
  formData.append('size', 'auto');
  formData.append('format', 'png');
  formData.append('channels', 'rgba');
  formData.append('bg_color', '#F0F0F0'); // Light grey background

  try {
    console.log('Sending request to PhotoRoom API...');
    const response = await axios.post('https://sdk.photoroom.com/v1/segment', formData, {
      headers: {
        'x-api-key': PHOTOROOM_API_KEY,
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'arraybuffer',
    });

    console.log('Received response from PhotoRoom API');
    return new Blob([response.data], { type: 'image/png' });
  } catch (error) {
    console.error('Background removal failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw new Error('Failed to remove background');
  }
}