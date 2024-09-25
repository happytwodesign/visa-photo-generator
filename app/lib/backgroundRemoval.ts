import axios from 'axios';

const PHOTOROOM_API_KEY = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;

export async function removeBackground(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('image_file', file);

  console.log('PhotoRoom API Key:', PHOTOROOM_API_KEY ? 'Set' : 'Not set');

  try {
    const response = await axios.post('https://sdk.photoroom.com/v1/segment', formData, {
      headers: {
        'x-api-key': PHOTOROOM_API_KEY || '',
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'arraybuffer',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (response.status !== 200) {
      const errorText = new TextDecoder().decode(response.data);
      console.error('PhotoRoom API error:', errorText);
      throw new Error(`PhotoRoom API error: ${response.status} ${errorText}`);
    }

    return new Blob([response.data], { type: 'image/png' });
  } catch (error) {
    console.error('Error in removeBackground:', error);
    if (axios.isAxiosError(error) && error.response) {
      const errorText = new TextDecoder().decode(error.response.data);
      console.error('PhotoRoom API error details:', errorText);
      throw new Error(`PhotoRoom API error: ${error.response.status} ${errorText}`);
    }
    throw error;
  }
}

export async function initiateBackgroundRemoval(photoUrl: string): Promise<string> {
  try {
    // Here you would typically make an API call to your background removal service
    // For this example, we'll simulate an API call with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate a successful response
    const processedPhotoUrl = `${photoUrl}?bg_removed=true`;

    return processedPhotoUrl;
  } catch (error) {
    console.error('Error in background removal:', error);
    throw new Error('Background removal failed');
  }
}