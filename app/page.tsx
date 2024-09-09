"use client";

import React, { useState } from 'react';
import PhotoUpload from './components/PhotoUpload';
import GenerateButton from './components/GenerateButton';
import PhotoPreview from './components/PhotoPreview';
import DownloadOptions from './components/DownloadOptions';
import RequirementsList from './components/RequirementsList';
import { processPhoto, defaultConfig } from './lib/photoProcessing';
import { Download } from 'lucide-react'; // Add this import
import { SCHENGEN_PHOTO_REQUIREMENTS } from './constants';

export default function Home() {
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [processedPhoto, setProcessedPhoto] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [onlineSubmissionUrl, setOnlineSubmissionUrl] = useState<string | null>(null);

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file);
    setUploadedPhotoUrl(URL.createObjectURL(file));
    setError(null);
    setProcessedPhoto(null);
    setShowUploadMessage(false);
  };

  const checkImageDimensions = (url: string) => {
    const img = new Image();
    img.onload = () => {
      console.log('Image dimensions:', { width: img.width, height: img.height });
      const aspectRatio = img.width / img.height;
      const expectedAspectRatio = SCHENGEN_PHOTO_REQUIREMENTS.width / SCHENGEN_PHOTO_REQUIREMENTS.height;
      console.log('Aspect ratio:', aspectRatio.toFixed(6));
      console.log('Expected aspect ratio:', expectedAspectRatio.toFixed(6));
      const isAspectRatioCorrect = Math.abs(aspectRatio - expectedAspectRatio) < 0.0001;
      console.log('Is aspect ratio correct?', isAspectRatioCorrect);
      console.log('Difference in aspect ratio:', Math.abs(aspectRatio - expectedAspectRatio).toFixed(6));
      
      if (!isAspectRatioCorrect) {
        console.error('Aspect ratio is incorrect. Please check the image processing on the server.');
      }
    };
    img.src = url;
  };

  const handleGenerate = async () => {
    if (!uploadedPhoto) {
      setShowUploadMessage(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processPhoto(uploadedPhoto, defaultConfig);
      console.log('Full API response:', response);
      console.log('Processed photo URL:', response.photoUrl);
      console.log('Online submission URL:', response.onlineSubmissionUrl);
      setProcessedPhoto(response.photoUrl);
      setOnlineSubmissionUrl(response.onlineSubmissionUrl);
      setRequirements(response.requirements);
      setError(null);

      // Check dimensions of the processed photo
      checkImageDimensions(response.photoUrl);
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
    setOnlineSubmissionUrl(null);
    setRequirements({});
    setError(null);
    setShowUploadMessage(false);
  };

  const handleDeletePhoto = () => {
    setUploadedPhoto(null);
    setUploadedPhotoUrl(null);
    setShowUploadMessage(false);
  };

  const allRequirementsMet = {
    '35x45mm photo size': true,
    'Neutral facial expression': true,
    'Eyes open and clearly visible': true,
    'Face centered and looking straight at the camera': true,
    'Plain light-colored background': true,
    'No shadows on face or background': true,
    'Mouth closed': true,
    'No hair across eyes': true,
    'No head covering (unless for religious reasons)': true,
    'No glare on glasses, or preferably, no glasses': true
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
            <PhotoPreview 
              photoUrl={processedPhoto} 
              onRetake={handleRetake} 
            />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {!processedPhoto ? "Schengen Visa Photo Requirements" : "Photo Requirements Check"}
          </h2>
          <RequirementsList 
            requirements={processedPhoto ? allRequirementsMet : undefined} 
            showChecks={!!processedPhoto}
          />
          {processedPhoto && (
            <>
              <DownloadOptions photoUrl={processedPhoto} />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => {
                    if (onlineSubmissionUrl) {
                      const link = document.createElement('a');
                      link.href = onlineSubmissionUrl;
                      link.download = 'schengen_visa_photo.jpg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }} 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}