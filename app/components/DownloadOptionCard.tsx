import React from 'react';
import { Checkbox } from './ui/checkbox';

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
    <div className="border rounded-lg p-2 flex flex-col items-center">
      <div 
        className="w-full mb-2" 
        style={{ 
          aspectRatio: aspectRatios[size], 
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="flex items-center space-x-2">
        <Checkbox id={`option-${size}`} checked={checked} onCheckedChange={onChange} />
        <label htmlFor={`option-${size}`}>{size}</label>
      </div>
    </div>
  );
}