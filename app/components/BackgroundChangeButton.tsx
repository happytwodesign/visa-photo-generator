import React from 'react';
import { Button } from './ui/button';

interface BackgroundChangeButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export const BackgroundChangeButton: React.FC<BackgroundChangeButtonProps> = ({ onClick, disabled }) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
      className="px-6"
    >
      Improve Background
    </Button>
  );
};