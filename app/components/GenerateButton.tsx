import React from 'react';
import { Button } from './ui/button';

interface GenerateButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  showMessage: boolean;
  className?: string;
}

export default function GenerateButton({ onClick, isProcessing, showMessage, className }: GenerateButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? 'Processing...' : 'Generate'}
    </Button>
  );
}