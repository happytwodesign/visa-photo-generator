import { NextApiRequest, NextApiResponse } from 'next';
import { processPhoto } from '../../app/lib/serverPhotoProcessing';
import { ProcessingConfigType } from '../../app/types';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const photo = req.body.photo;
    const config: ProcessingConfigType = JSON.parse(req.body.config);

    const photoBuffer = Buffer.from(photo, 'base64');
    const processedBuffer = await processPhoto(photoBuffer, config);

    // Convert the processed buffer to base64
    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`; // Make sure this is 'image/png' if you're using PNG format

    // Get the dimensions of the processed image
    const metadata = await sharp(processedBuffer).metadata();

    res.status(200).json({
      photoUrl: dataUrl,
      onlineSubmissionUrl: dataUrl,
      requirements: {
        '35x45mm photo size': metadata.width === 413 && metadata.height === 531,
        'Neutral facial expression': true,
        'Eyes open and clearly visible': true,
        'Face centered and looking straight at the camera': true,
        'Plain light-colored background': config.changeBgToLightGray,
        'No shadows on face or background': true,
        'Mouth closed': true,
        'No hair across eyes': true,
        'No head covering (unless for religious reasons)': true,
        'No glare on glasses, or preferably, no glasses': true
      },
    });
  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ error: 'Failed to process photo' });
  }
}