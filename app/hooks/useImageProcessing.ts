import { useState } from "react";
import { removeBackground } from "@/utils/imageProcessing";

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File, removeBg: boolean) => {
    setIsProcessing(true);
    try {
      // Existing image processing steps...
      let processedImageUrl = ''; // Assume this is set by your existing processing steps

      if (removeBg) {
        const removedBgImage = await removeBackground(processedImageUrl);
        processedImageUrl = removedBgImage;
      }

      setProcessedImage(processedImageUrl);
      setIsProcessing(false);
      
      return {
        photoUrl: processedImageUrl,
        onlineSubmissionUrl: processedImageUrl, // Adjust if needed
        requirements: {/* Your requirements check logic */},
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setIsProcessing(false);
      throw error;
    }
  };

  return { processImage, isProcessing, processedImage, error };
}