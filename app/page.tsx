"use client";

import React, { useState, useEffect } from 'react';
import PhotoUpload from './components/PhotoUpload';
import GenerateButton from './components/GenerateButton';
import PhotoPreview from './components/PhotoPreview';
import DownloadOptions from './components/DownloadOptions';
import RequirementsList from './components/RequirementsList';
import { processPhoto, defaultConfig } from './lib/photoProcessing';
import { SCHENGEN_PHOTO_REQUIREMENTS } from './constants';
import { ProcessingConfigType } from './types';
import { Button } from './components/ui/button';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { generateTemplates } from './lib/templateGenerator';
import { ArrowLeft, Check } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import UploadPage from './components/UploadPage';

export default function Home() {
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [processedPhoto, setProcessedPhoto] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [onlineSubmissionUrl, setOnlineSubmissionUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<ProcessingConfigType>({
    ...defaultConfig,
    photoRoomApiKey: process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY || '',
  });
  const [selectedSizes, setSelectedSizes] = useState<Set<'online' | 'A4' | 'A5' | 'A6'>>(new Set(['online']));
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState(false);

  useEffect(() => {
    const storedRemoveBg = localStorage.getItem('removeBg');
    if (storedRemoveBg !== null) {
      setRemoveBg(JSON.parse(storedRemoveBg));
    }
  }, []);

  const handleRemoveBgChange = (checked: boolean) => {
    setRemoveBg(checked);
    localStorage.setItem('removeBg', JSON.stringify(checked));
  };

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file);
    setUploadedPhotoUrl(URL.createObjectURL(file));
    setError(null);
    setProcessedPhoto(null);
    setShowUploadMessage(false);
  };

  const checkImageDimensions = (url: string) => {
    const img = document.createElement('img');
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
      const processingConfig = {
        ...config,
        removeBackground: removeBg,
        photoRoomApiKey: process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY || '',
      };
      console.log('Processing config:', processingConfig);
      const response = await processPhoto(uploadedPhoto, processingConfig);
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
      setError(`Failed to process photo. Error: ${error instanceof Error ? error.message : String(error)}`);
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

  const handleDownload = async () => {
    if (selectedSizes.size === 0) {
      setDownloadError('Please select at least one option to download.');
      return;
    }

    setDownloadError(null);

    if (selectedSizes.has('online') && processedPhoto) {
      const link = document.createElement('a');
      link.href = processedPhoto;
      link.download = 'schengen_visa_photo_online.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    const paperSizes = ['A4', 'A5', 'A6'];
    const selectedPaperSizes = paperSizes.filter(size => selectedSizes.has(size as 'A4' | 'A5' | 'A6'));

    if (selectedPaperSizes.length > 0 && processedPhoto) {
      try {
        const templates = await generateTemplates(processedPhoto);
        selectedPaperSizes.forEach((size, index) => {
          const blob = templates[paperSizes.indexOf(size)];
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `schengen_visa_photo_${size.toLowerCase()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
      } catch (error) {
        console.error('Error generating templates:', error);
        setError('Failed to generate templates for download.');
      }
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="max-w-5xl mx-auto text-[#0F172A] relative min-h-screen pb-20 md:pb-0">
      <div className={`${isMobile ? 'w-[80%] mx-auto' : 'w-full'}`}>
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Schengen Visa</h1>
        <p className="text-base md:text-lg mb-4 md:mb-8">Get your perfect Schengen visa photo in just a few clicks.</p>
        
        <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-8`}>
          {/* Left column - Photo upload/preview */}
          <div className="flex flex-col">
            {!processedPhoto ? (
              <div className="bg-white rounded-[10px] overflow-hidden relative md:w-full w-full mx-auto" style={{ aspectRatio: '35/45' }}>
                <PhotoUpload 
                  onUpload={handlePhotoUpload} 
                  uploadedPhotoUrl={uploadedPhotoUrl} 
                  onDelete={handleDeletePhoto}
                />
              </div>
            ) : (
              <div className="md:w-full w-full mx-auto">
                <PhotoPreview photoUrl={processedPhoto} />
              </div>
            )}
            {!isMobile && (
              <>
                {!processedPhoto ? (
                  <div className="mt-4">
                    <GenerateButton 
                      onClick={handleGenerate} 
                      isProcessing={isProcessing} 
                      showMessage={showUploadMessage}
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex justify-start">
                    <Button 
                      onClick={handleRetake} 
                      variant="outline" 
                      className="flex items-center border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retake
                    </Button>
                  </div>
                )}
              </>
            )}
            {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
          </div>

          {/* Right column - Requirements and Download options */}
          <div className="flex flex-col h-full">
            {!isMobile && (
              <h3 className="text-2xl font-semibold mb-4">
                {!processedPhoto ? "Schengen Visa Photo Requirements" : "Photo Requirements Check"}
              </h3>
            )}
            
            <div className="flex-grow">
              {/* Requirements list */}
              <RequirementsList 
                requirements={processedPhoto ? allRequirementsMet : undefined} 
                showChecks={!!processedPhoto}
              />

              {/* Download options - only show when photo is processed */}
              {processedPhoto && (
                <div className="mt-4">
                  <DownloadOptions 
                    photoUrl={processedPhoto} 
                    onlineSubmissionUrl={onlineSubmissionUrl || ''}
                    onSelectionChange={setSelectedSizes}
                  />
                </div>
              )}
              
              {!processedPhoto && !isMobile && (
                <div className="flex items-center space-x-2 mt-4 mb-4">
                  <Switch
                    id="remove-bg"
                    checked={removeBg}
                    onCheckedChange={handleRemoveBgChange}
                  />
                  <Label htmlFor="remove-bg">Remove Background</Label>
                </div>
              )}
            </div>
            
            {/* Download button - always at the bottom */}
            {processedPhoto && !isMobile && (
              <div className="mt-4">
                <Button 
                  onClick={handleDownload} 
                  className="w-full px-6"
                >
                  Download Selected
                </Button>
                {downloadError && <p className="text-gray-500 mt-2 text-center">{downloadError}</p>}
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            {!processedPhoto ? (
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remove-bg-mobile"
                    checked={removeBg}
                    onCheckedChange={handleRemoveBgChange}
                  />
                  <Label htmlFor="remove-bg-mobile">Remove Background</Label>
                </div>
                <GenerateButton 
                  onClick={handleGenerate} 
                  isProcessing={isProcessing} 
                  showMessage={showUploadMessage}
                />
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <Button 
                  onClick={handleRetake} 
                  variant="outline" 
                  className="flex items-center border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button 
                  onClick={handleDownload} 
                  className="w-auto px-6"
                >
                  Download Selected
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}