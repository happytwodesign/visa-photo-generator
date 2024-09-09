"use client";

import React, { useState } from 'react';
import PhotoUpload from './components/PhotoUpload';
import GenerateButton from './components/GenerateButton';
import PhotoPreview from './components/PhotoPreview';
import DownloadOptions from './components/DownloadOptions';
import RequirementsList from './components/RequirementsList';
import { processPhoto, defaultConfig } from './lib/photoProcessing';

export default function Home() {
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [processedPhoto, setProcessedPhoto] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file);
    setUploadedPhotoUrl(URL.createObjectURL(file));
    setError(null);
    setProcessedPhoto(null);
    setShowUploadMessage(false);
  };

  const handleGenerate = async () => {
    if (!uploadedPhoto) {
      setShowUploadMessage(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processPhoto(uploadedPhoto, defaultConfig);
      setProcessedPhoto(response.photoUrl);
      setRequirements(response.requirements);
      setError(null);
    } catch (error) {
      console.error('Error processing photo:', error);
      setError('Failed to process photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setUploadedPhoto(null);
    setUploadedPhotoUrl(null);
    setProcessedPhoto(null);
    setRequirements({});
    setError(null);
    setShowUploadMessage(false);
  };

  const handleDeletePhoto = () => {
    setUploadedPhoto(null);
    setUploadedPhotoUrl(null);
    setShowUploadMessage(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Schengen Visa</h1>
      <p className="text-lg mb-8">Get your perfect Schengen visa photo in just a few clicks.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col">
          {!processedPhoto ? (
            <>
              <div className="bg-white rounded-[10px] overflow-hidden" style={{ aspectRatio: '35/45' }}>
                <PhotoUpload 
                  onUpload={handlePhotoUpload} 
                  uploadedPhotoUrl={uploadedPhotoUrl} 
                  onDelete={handleDeletePhoto}
                />
              </div>
              <GenerateButton 
                onClick={handleGenerate} 
                isProcessing={isProcessing} 
                showMessage={showUploadMessage}
              />
              {error && <p className="text-destructive mt-2 text-center">{error}</p>}
            </>
          ) : (
            <PhotoPreview photoUrl={processedPhoto} onRetake={handleRetake} />
          )}
        </div>
        <div>
          <RequirementsList requirements={processedPhoto ? requirements : undefined} />
          {processedPhoto && (
            <>
              <DownloadOptions photoUrl={processedPhoto} />
              <div className="mt-4 flex justify-end">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Download</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}