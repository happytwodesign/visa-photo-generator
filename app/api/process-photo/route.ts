import { NextResponse } from 'next/server';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(request: Request) {
  const photoRoomApiKey = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;

  if (!photoRoomApiKey) {
    return NextResponse.json({ error: 'PhotoRoom API key is not set' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const config = JSON.parse(formData.get('config') as string);

    // Step 1: Resize the image to 35x45 ratio
    let buffer = await photo.arrayBuffer();
    let image = sharp(Buffer.from(buffer));
    image = image.resize(350, 450, { fit: 'cover' });

    // Convert image to buffer
    let photoBuffer = await image.toBuffer();

    // Step 2: Remove background using PhotoRoom API
    if (config.removeBackground) {
      const photoRoomFormData = new FormData();
      photoRoomFormData.append('image_file', photoBuffer, {
        filename: 'image.png',
        contentType: 'image/png',
      });

      try {
        const photoRoomResponse = await axios.post('https://sdk.photoroom.com/v1/segment', photoRoomFormData, {
          headers: {
            ...photoRoomFormData.getHeaders(),
            'x-api-key': photoRoomApiKey,
          },
          responseType: 'arraybuffer',
        });

        image = sharp(photoRoomResponse.data);
        // Resize again to ensure 350x450 after background removal
        image = image.resize(350, 450, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } });
        photoBuffer = await image.toBuffer();
      } catch (photoRoomError: unknown) {
        if (axios.isAxiosError(photoRoomError) && photoRoomError.response) {
          console.error('PhotoRoom API Error:', photoRoomError.response.data);
        } else {
          console.error('PhotoRoom API Error:', photoRoomError);
        }
        throw new Error('Failed to remove background');
      }
    }

    // Step 3: We're no longer cropping the image, as we want to maintain the 350x450 ratio

    // Convert the processed image to a base64 string
    const base64Image = photoBuffer.toString('base64');

    return NextResponse.json({ 
      photoUrl: `data:image/png;base64,${base64Image}`,
      onlineSubmissionUrl: `data:image/png;base64,${base64Image}`,
      requirements: {
        '35x45mm photo size': true,
        'Neutral facial expression': true,
        'Eyes open and clearly visible': true,
        'Face centered and looking straight at the camera': true,
        'Plain light-colored background': config.removeBackground,
        'No shadows on face or background': true,
        'Mouth closed': true,
        'No hair across eyes': true,
        'No head covering (unless for religious reasons)': true,
        'No glare on glasses, or preferably, no glasses': true
      }
    });
  } catch (error: unknown) {
    console.error('Error processing photo:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process photo' }, { status: 500 });
  }
}