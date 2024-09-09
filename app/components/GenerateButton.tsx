import React from 'react';
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  showMessage: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isProcessing, showMessage }) => {
  return (
    <div className="mt-4">
      <Button
        onClick={onClick}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Generate'}
      </Button>
      <div className="h-6 mt-2">
        {showMessage && (
          <p className="text-sm text-muted-foreground text-center">
            Upload a photo to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default GenerateButton;