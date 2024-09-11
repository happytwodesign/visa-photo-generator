import React from 'react';
import { Button } from './ui/button';

interface GenerateButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  showMessage: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isProcessing, showMessage }) => {
  return (
    <div>
      <Button
        onClick={onClick}
        disabled={isProcessing}
        className="w-full h-10 text-sm font-medium bg-primary text-primary-foreground"
      >
        {isProcessing ? 'Processing...' : 'Generate'}
      </Button>
      {showMessage && <p className="text-gray-500 mt-2 text-center">Please upload a photo first.</p>}
    </div>
  );
};

export default GenerateButton;