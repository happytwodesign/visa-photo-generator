'use client';

import React, { useState } from 'react';
import PhotoUpload from './PhotoUpload';
import { processPhoto, ProcessingConfig } from '../lib/photoProcessing';

const UploadPage: React.FC = () => {
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [onlineSubmissionUrl, setOnlineSubmissionUrl] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    setUploadedPhoto(file);
    setUploadedPhotoUrl(URL.createObjectURL(file));
  };

  const handleDeletePhoto = () => {
    setUploadedPhoto(null);
    setUploadedPhotoUrl(null);
  };

  const handleProcessImage = async () => {
    if (!uploadedPhoto) {
      setError('Please upload a photo first');
      return;
    }

    try {
      const storedRemoveBg = localStorage.getItem('removeBg');
      const removeBg = storedRemoveBg ? JSON.parse(storedRemoveBg) : false;
      
      const processingConfig: ProcessingConfig = {
        resize: true,
        removeBackground: removeBg,
        changeBgToLightGray: true,
        fitHead: true,
        fixHeadTilt: true,
        adjustContrast: true,
        photoRoomApiKey: process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY || '',
      };

      const result = await processPhoto(uploadedPhoto, processingConfig);
      setProcessedImage(result.photoUrl);
      setOnlineSubmissionUrl(result.onlineSubmissionUrl);
      setRequirements(result.requirements);
      setError(null);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process the image. Please try again.');
    }
  };

  return (
    <div>
      <h1>Upload and Process Your Image</h1>
      <PhotoUpload 
        onUpload={handleImageUpload}
        uploadedPhotoUrl={uploadedPhotoUrl}
        onDelete={handleDeletePhoto}
      />
      <button onClick={handleProcessImage}>Process Image</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {processedImage && (
        <div>
          <h2>Processed Image:</h2>
          <img src={processedImage} alt="Processed" />
        </div>
      )}
      {onlineSubmissionUrl && (
        <div>
          <h2>Online Submission URL:</h2>
          <a href={onlineSubmissionUrl} target="_blank" rel="noopener noreferrer">
            {onlineSubmissionUrl}
          </a>
        </div>
      )}
      {Object.keys(requirements).length > 0 && (
        <div>
          <h2>Requirements Check:</h2>
          <ul>
            {Object.entries(requirements).map(([req, met]) => (
              <li key={req}>
                {req}: {met ? '✅' : '❌'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadPage;