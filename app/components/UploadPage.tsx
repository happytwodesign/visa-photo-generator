'use client';

import { useState } from "react";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import RequirementsList from './RequirementsList';
import PhotoUpload from './PhotoUpload';
import GenerateButton from './GenerateButton';
import PhotoPreview from './PhotoPreview';
import DownloadOptions from './DownloadOptions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function UploadPage() {
  const { processImage, isProcessing, processedImage, error } = useImageProcessing();
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [onlineSubmissionUrl, setOnlineSubmissionUrl] = useState<string | null>(null);

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file);
    setUploadedPhotoUrl(URL.createObjectURL(file));
    setShowUploadMessage(false);
  };

  const handleGenerate = async () => {
    if (!uploadedPhoto) {
      setShowUploadMessage(true);
      return;
    }

    try {
      const storedRemoveBg = localStorage.getItem('removeBg');
      const removeBg = storedRemoveBg ? JSON.parse(storedRemoveBg) : false;
      const result = await processImage(uploadedPhoto, removeBg);
      setProcessedImage(result.photoUrl);
      setOnlineSubmissionUrl(result.onlineSubmissionUrl);
      setRequirements(result.requirements);
    } catch (err) {
      console.error('Error processing photo:', err);
    }
  };

  const handleRetake = () => {
    setUploadedPhoto(null);
    setUploadedPhotoUrl(null);
    setProcessedImage(null);
    setOnlineSubmissionUrl(null);
    setRequirements({});
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Upload Your Photo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {!processedImage ? (
            <>
              <PhotoUpload onUpload={handlePhotoUpload} uploadedPhotoUrl={uploadedPhotoUrl} onDelete={() => setUploadedPhoto(null)} />
              <GenerateButton onClick={handleGenerate} isProcessing={isProcessing} showMessage={showUploadMessage} />
            </>
          ) : (
            <>
              <PhotoPreview photoUrl={processedImage} />
              <Button onClick={handleRetake} variant="link" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retake
              </Button>
            </>
          )}
        </div>
        
        <div>
          <RequirementsList requirements={requirements} showChecks={!!processedImage} />
          
          {processedImage && (
            <DownloadOptions 
              photoUrl={processedImage} 
              onlineSubmissionUrl={onlineSubmissionUrl || ''} 
              onSelectionChange={() => {}} // Add a proper handler if needed
            />
          )}
        </div>
      </div>
      
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}