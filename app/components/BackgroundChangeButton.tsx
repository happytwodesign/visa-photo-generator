import React from 'react';
import { Button } from './ui/button';

interface BackgroundChangeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function BackgroundChangeButton({ onClick, disabled }: BackgroundChangeButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled}>
      Change Background for $2.99
    </Button>
  );
}