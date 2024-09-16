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
        className="w-full h-auto object-contain"
      />
    </div>
  );
}