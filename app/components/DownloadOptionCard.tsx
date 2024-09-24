import React from 'react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label'; // Correct import statement for Label

interface DownloadOptionCardProps {
  size: 'online' | 'A4' | 'A5' | 'A6';
  checked: boolean;
  onChange: (checked: boolean) => void;
  photoUrl: string;
}

const aspectRatios = {
  online: '35 / 45',
  A4: '210 / 297',
  A5: '148 / 210',
  A6: '105 / 148',
};

export function DownloadOptionCard({ size, checked, onChange, photoUrl }: DownloadOptionCardProps) {
  return (
    <div className="border rounded-lg p-2 flex flex-col items-center justify-between" style={{ flex: '1 1 auto' }}>
      <div 
        className="w-full mb-2" 
        style={{ 
          aspectRatio: aspectRatios[size], 
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '2px',
        }}
      />
      <div className="flex items-center space-x-2">
        <Checkbox id={`option-${size}`} checked={checked} onCheckedChange={onChange} />
        <Label htmlFor={`option-${size}`}>{size}</Label>
      </div>
    </div>
  );
}