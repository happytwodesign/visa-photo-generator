import React from 'react';
import { Button } from './ui/button';

interface GenerateButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  showMessage: boolean;
  className?: string;
  children?: React.ReactNode;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  isProcessing,
  showMessage,
  className,
  children
}) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? 'Processing...' : children}
    </Button>
  );
};

export default GenerateButton;
