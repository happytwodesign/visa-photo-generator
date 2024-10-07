"use client";

import React, { useState, useEffect } from 'react';
import PhotoUpload from './components/PhotoUpload';
import GenerateButton from './components/GenerateButton';
import PhotoPreview from './components/PhotoPreview';
import DownloadOptions from './components/DownloadOptions';
import { processPhoto, defaultConfig } from './lib/photoProcessing';
import { SCHENGEN_PHOTO_REQUIREMENTS } from './constants';
import { ProcessingConfigType } from './types';
import { Button } from './components/ui/button';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { generateTemplates } from './lib/templateGenerator';
import { ArrowLeft, Check } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { removeBackground } from './lib/backgroundRemoval';
import { EmailPhotosModal } from './components/EmailPhotosModal';
import { sendEmailWithPhotos } from './lib/emailService';
import { BackgroundChangeButton } from './components/BackgroundChangeButton';
import { SuccessModal } from './components/SuccessModal';
import { INITIAL_REQUIREMENTS } from './constants';
import RequirementsList from './components/RequirementsList';
import RequirementsCheck from './components/RequirementsCheck';

const convertToJPEG = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'converted.jpg', { type: 'image/jpeg' }));
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, 'image/jpeg', 0.95);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const convertHeicToJpeg = async (file: File): Promise<File> => {
  if (typeof window === 'undefined') {
    // We're on the server side, return the original file
    return file;
  }

  if (file.type === 'image/heic' || file.type === 'image/heif') {
    try {
      // Dynamically import heic2any only on the client side
      const heic2any = (await import('heic2any')).default;
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      return new File([Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Failed to convert HEIC image to JPEG');
    }
  }
  return file;
};

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
  const [selectedSize, setSelectedSize] = useState<'online' | 'A4' | 'A5' | 'A6' | null>('online');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [backgroundRemovedPhoto, setBackgroundRemovedPhoto] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [isCorrectingBackground, setIsCorrectingBackground] = useState(false);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [backgroundChangeInitiated, setBackgroundChangeInitiated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [detailedRequirements, setDetailedRequirements] = useState<Record<string, { status: 'met' | 'not_met' | 'uncertain', message?: string }>>({});
  const [initialRequirements, setInitialRequirements] = useState<string[]>(INITIAL_REQUIREMENTS);

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

  const handlePhotoUpload = async (file: File) => {
    try {
      let processedFile = await convertHeicToJpeg(file);
      processedFile = await convertToJPEG(processedFile);
      setUploadedPhoto(processedFile);
      setUploadedPhotoUrl(URL.createObjectURL(processedFile));
      setError(null);
      setProcessedPhoto(null);
      setShowUploadMessage(false);
      setGenerateError(null);
    } catch (error) {
      console.error('Error processing photo:', error);
      setError('Failed to process the uploaded photo. Please try a different image.');
    }
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
      setGenerateError('Please select a photo before generating.');
      return;
    }

    setGenerateError(null);
    setIsProcessing(true);
    setBackgroundRemoved(false);
    setBackgroundChangeInitiated(false);
    setIsBackgroundRemoved(false);
    setDownloadError(null);
    
    try {
      const processingConfig = {
        ...config,
        removeBackground: removeBg,
        photoRoomApiKey: process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY || '',
      };
      console.log('Processing config:', processingConfig);

      const formData = new FormData();
      formData.append('photo', uploadedPhoto);
      formData.append('config', JSON.stringify(processingConfig));

      // Initial request to start processing
      const response = await fetch('/api/process-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const { jobId } = await response.json();

      // Poll for job completion
      let jobComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // Increase max attempts to 60 (2 minutes total)

      while (!jobComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds

        try {
          const statusResponse = await fetch(`/api/process-photo?jobId=${jobId}`);
          if (!statusResponse.ok) {
            if (statusResponse.status === 504) {
              console.log(`Job status check timed out (attempt ${attempts + 1}), retrying...`);
              attempts++;
              continue;
            }
            throw new Error(`Failed to check job status: ${statusResponse.status}`);
          }

          const jobData = await statusResponse.json();
          console.log('Job status:', jobData.status);

          if (jobData.status === 'completed') {
            jobComplete = true;
            if (!jobData.result) {
              throw new Error('Job completed but no result found');
            }
            setProcessedPhoto(jobData.result.photoUrl);
            setOnlineSubmissionUrl(jobData.result.onlineSubmissionUrl);
            setDetailedRequirements(jobData.result.requirements);

            // Convert detailed requirements to simplified format
            const simplifiedRequirements = Object.entries(jobData.result.requirements).reduce((acc, [key, value]: [string, any]) => {
              acc[key] = value.status === 'met';
              return acc;
            }, {} as Record<string, boolean>);
            setRequirements(simplifiedRequirements);

            setCurrentPhotoUrl(jobData.result.photoUrl);
            checkImageDimensions(jobData.result.photoUrl);
          } else if (jobData.status === 'failed') {
            throw new Error(jobData.error || 'Job processing failed');
          } else if (jobData.status === 'processing') {
            attempts++;
          }
        } catch (error) {
          console.error('Error checking job status:', error);
          attempts++;
        }
      }

      if (!jobComplete) {
        throw new Error('Job processing timed out. Please try again or contact support if the issue persists.');
      }

      setError(null);
    } catch (error) {
      console.error('Error processing photo:', error);
      let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setGenerateError(errorMessage);
      
      setProcessedPhoto(null);
      setOnlineSubmissionUrl(null);
      setRequirements({});
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
    setBackgroundRemoved(false);
    setBackgroundChangeInitiated(false);
    setDownloadError(null);
    setGenerateError(null);
    setCurrentPhotoUrl(null);
    setIsBackgroundRemoved(false);
    setIsCorrectingBackground(false);
    setIsProcessing(false);
    setShowEmailModal(false);
    setEmailSent(false);
    setSentEmail('');
    setIsEmailSending(false);
  };

  const handleDeletePhoto = () => {
    setUploadedPhoto(null);
    setUploadedPhotoUrl(null);
    setProcessedPhoto(null);
    setCurrentPhotoUrl(null);
    setOnlineSubmissionUrl(null);
    setBackgroundRemoved(false);
    setBackgroundChangeInitiated(false);
    setRequirements({});
    setError(null);
    setDownloadError(null); // Clear download error
    setGenerateError(null); // Clear generate error
    setIsBackgroundRemoved(false);
    setIsCorrectingBackground(false);
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

  const handleBackgroundRemoval = async () => {
    setBackgroundChangeInitiated(true);
    if (!processedPhoto && !currentPhotoUrl) {
      setDownloadError('No photo available for background removal.');
      setBackgroundChangeInitiated(false); // Reset if there's no photo
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_PHOTOROOM_API_KEY;
    if (!apiKey) {
      setDownloadError('PhotoRoom API key is not set. Please check your environment variables.');
      setBackgroundChangeInitiated(false); // Reset if there's no API key
      return;
    }

    setDownloadError(null);
    setIsCorrectingBackground(true);
    try {
      // Use currentPhotoUrl if available, otherwise use processedPhoto
      const photoUrlToUse = currentPhotoUrl || processedPhoto;
      if (!photoUrlToUse) {
        throw new Error('No valid photo URL available');
      }

      console.log('Attempting to remove background from:', photoUrlToUse);

      // Convert the photo URL to a Blob
      const response = await fetch(photoUrlToUse);
      if (!response.ok) {
        throw new Error(`Failed to fetch photo: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Create a File object from the Blob
      const file = new File([blob], 'photo_to_process.png', { type: 'image/png' });

      console.log('File created for background removal:', file);

      const backgroundRemovedBlob = await removeBackground(file);
      console.log('Background removed, blob created:', backgroundRemovedBlob);

      const backgroundRemovedUrl = URL.createObjectURL(backgroundRemovedBlob);
      console.log('Background removed URL created:', backgroundRemovedUrl);

      setCurrentPhotoUrl(backgroundRemovedUrl);
      setProcessedPhoto(backgroundRemovedUrl);
      setOnlineSubmissionUrl(backgroundRemovedUrl);
      setIsBackgroundRemoved(true);
      setBackgroundRemoved(true);
      console.log('Background removal completed, new URL:', backgroundRemovedUrl);
    } catch (error) {
      console.error('Error in background removal:', error);
      setDownloadError(`Failed to remove background: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBackgroundChangeInitiated(false); // Reset if there's an error
      setIsBackgroundRemoved(false);
      setBackgroundRemoved(false);
    } finally {
      setIsCorrectingBackground(false);
    }
  };

  const handleEmailPhotos = () => {
    setShowEmailModal(true);
    setEmailSent(false);
    setSentEmail('');
    setError(null);
    setIsEmailSending(false);
  };

  const handleSendEmail = async (email: string) => {
    setIsEmailSending(true);
    try {
      if (!currentPhotoUrl) {
        throw new Error('No photo available to send');
      }

      const paperSizes = ['A4', 'A5', 'A6'];
      const templates = await generateTemplates(currentPhotoUrl);
      const pdfUrls = await Promise.all(
        paperSizes.map(async (size, index) => {
          const blob = templates[index];
          const formData = new FormData();
          formData.append('file', blob, `schengen_visa_photo_${size.toLowerCase()}.pdf`);
          const response = await fetch('/api/upload-pdf', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(`Failed to upload ${size} PDF`);
          }
          const data = await response.json();
          return data.url;
        })
      );

      await sendEmailWithPhotos(email, currentPhotoUrl, pdfUrls);
      setEmailSent(true);
      setSentEmail(email);
    } catch (error) {
      console.error('Error sending email:', error);
      setError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsEmailSending(false);
      setShowEmailModal(false);
      // Add a small delay before resetting the email sent state
      setTimeout(() => {
        setEmailSent(false);
        setSentEmail('');
      }, 3000); // 3 seconds delay
    }
  };

  const handleDownload = async () => {
    if (!selectedSize) {
      setDownloadError('Please select an option to download.');
      return;
    }

    setDownloadError(null);

    if (!currentPhotoUrl) {
      setDownloadError('No photo available for download.');
      return;
    }

    if (selectedSize === 'online') {
      const link = document.createElement('a');
      link.href = currentPhotoUrl;
      link.download = 'schengen_visa_photo_online.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const paperSizes = ['A4', 'A5', 'A6'];
      if (paperSizes.includes(selectedSize)) {
        try {
          const templates = await generateTemplates(currentPhotoUrl);
          const blob = templates[paperSizes.indexOf(selectedSize)];
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `schengen_visa_photo_${selectedSize.toLowerCase()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error generating templates:', error);
          setDownloadError('Failed to generate templates for download.');
        }
      }
    }
  };

  useEffect(() => {
    // Clear download error when selected sizes change
    setDownloadError(null);
  }, [selectedSize]);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Update currentPhotoUrl when processedPhoto changes
  useEffect(() => {
    if (processedPhoto) {
      setCurrentPhotoUrl(processedPhoto);
    }
  }, [processedPhoto]);

  return (
    <div className={!isMobile ? 'flex flex-col min-h-screen' : ''}>
      <div className="max-w-5xl mx-auto text-[#0F172A] w-full flex flex-col flex-grow">
        <div className={!isMobile ? 'flex-grow flex items-center' : ''}>
          <div className={isMobile ? 'w-full px-4' : 'w-full'}>
            <div className={isMobile ? 'max-w-[350px] mx-auto' : ''}>
              <h1 className={`text-2xl md:text-4xl font-bold ${isMobile ? 'mb-1 text-left' : 'mb-2'}`}>Schengen Visa</h1>
              <p className={`text-base md:text-lg ${isMobile ? 'mb-2 text-left' : 'mb-4 md:mb-8'}`}>
                Get your perfect Schengen visa photo in just a few clicks.
              </p>
            </div>
            
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-8`}>
              {/* Left column - Photo upload/preview */}
              <div className="flex flex-col items-center justify-start h-full">
                <div className={`w-full ${!isMobile ? 'max-w-full' : 'max-w-[350px]'} flex flex-col ${!isMobile ? 'h-[calc(100%)]' : 'h-full'}`}>
                  <div className="w-full h-0 pb-[128.57%] relative">
                    {!processedPhoto ? (
                      <PhotoUpload 
                        onUpload={handlePhotoUpload} 
                        uploadedPhotoUrl={uploadedPhotoUrl} 
                        onDelete={handleDeletePhoto}
                      />
                    ) : (
                      <PhotoPreview photoUrl={currentPhotoUrl || ''} />
                    )}
                  </div>
                  {!isMobile && (
                    <div className="mt-4 flex flex-col w-full">
                      <div>
                        {!processedPhoto ? (
                          <GenerateButton 
                            onClick={handleGenerate} 
                            isProcessing={isProcessing} 
                            showMessage={false}
                            className="w-full"
                          />
                        ) : null}
                        <div className="h-6 mt-2">
                          {generateError && <p className="text-gray-500 text-sm">{generateError}</p>}
                          {error && <p className="text-gray-500 text-sm">{error}</p>}
                        </div>
                      </div>
                      {processedPhoto && (
                        <div className="flex justify-start mt-4">
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
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - Requirements and Download options */}
              <div className={`flex flex-col ${processedPhoto && !isMobile ? 'h-[calc(100%+24px)]' : 'h-full'}`}>
                {!isMobile && (
                  <h3 className="text-2xl font-semibold mb-4">
                    {!processedPhoto ? "Photo Requirements" : "Requirements Check"}
                  </h3>
                )}
                
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    {isMobile && processedPhoto && (
                      <div className="mb-12 w-full max-w-[350px] mx-auto">
                        <h4 className="text-lg font-semibold mb-2 text-left">Ready to download</h4>
                        <DownloadOptions 
                          photoUrl={currentPhotoUrl || processedPhoto || ''}
                          onlineSubmissionUrl={currentPhotoUrl || onlineSubmissionUrl || ''}
                          onSelectionChange={setSelectedSize}
                        />
                      </div>
                    )}

                    {/* Requirements list */}
                    <div className={`${isMobile ? 'mb-32 max-w-[350px] mx-auto' : ''}`}>
                      {!processedPhoto ? (
                        <div>
                          <ul className="list-disc pl-5 space-y-3"> {/* Added space-y-3 here */}
                            {initialRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <RequirementsCheck requirements={detailedRequirements} />
                        </div>
                      )}
                    </div>

                    {!isMobile && processedPhoto && (
                      <div className="mt-4">
                        <h4 className="text-lg font-semibold mb-2">Ready to download</h4>
                        <DownloadOptions 
                          photoUrl={currentPhotoUrl || processedPhoto || ''}
                          onlineSubmissionUrl={currentPhotoUrl || onlineSubmissionUrl || ''}
                          onSelectionChange={setSelectedSize}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Download button - always at the bottom for non-mobile */}
                  {processedPhoto && !isMobile && (
                    <div className="mt-4 flex flex-col items-end">
                      {!isBackgroundRemoved ? (
                        <BackgroundChangeButton 
                          onClick={handleBackgroundRemoval} 
                          disabled={isProcessing || isCorrectingBackground}
                        />
                      ) : (
                        <Button 
                          onClick={handleEmailPhotos} 
                          className="px-6" 
                          disabled={isEmailSending}
                        >
                          Email photos
                        </Button>
                      )}
                      <div className="h-6">
                        {downloadError && <p className="text-gray-500 mt-2 text-sm">{downloadError}</p>}
                        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            {processedPhoto ? (
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={handleRetake} 
                    variant="outline" 
                    className="flex items-center border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                    disabled={isProcessing || isCorrectingBackground}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  {!isBackgroundRemoved ? (
                    <BackgroundChangeButton 
                      onClick={handleBackgroundRemoval} 
                      disabled={isProcessing || isCorrectingBackground} 
                    />
                  ) : (
                    <Button 
                      onClick={handleEmailPhotos} 
                      className="w-auto px-6" 
                      disabled={isProcessing || isCorrectingBackground || isEmailSending}
                    >
                      Email photos
                    </Button>
                  )}
                </div>
                {downloadError && <p className="text-gray-500 mt-2 text-sm">{downloadError}</p>}
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                {(isProcessing || isCorrectingBackground) && (
                  <p className="text-gray-500 mt-2 text-center text-sm">Processing...</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center w-full max-w-[350px] mx-auto">
                <div className="w-full max-w-[350px] mx-auto">
                  <GenerateButton 
                    onClick={handleGenerate} 
                    isProcessing={isProcessing} 
                    showMessage={false}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showEmailModal && (
        <EmailPhotosModal
          onClose={() => {
            setShowEmailModal(false);
            setError(null);
          }}
          onSend={handleSendEmail}
          isLoading={isEmailSending}
        />
      )}
      
      {emailSent && (
        <SuccessModal
          email={sentEmail}
          onClose={() => {
            setEmailSent(false);
            setSentEmail('');
          }}
        />
      )}
    </div>
  );
}