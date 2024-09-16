import React from 'react';

interface PhotoPreviewProps {
  photoUrl: string;
}

export default function PhotoPreview({ photoUrl }: PhotoPreviewProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <img 
        src={photoUrl} 
        alt="Processed photo" 
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}