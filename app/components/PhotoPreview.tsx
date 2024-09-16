import React from 'react';

interface PhotoPreviewProps {
  photoUrl: string;
}

export default function PhotoPreview({ photoUrl }: PhotoPreviewProps) {
  return (
    <div className="w-full h-0 pb-[128.57%] relative bg-gray-100"> {/* 128.57% is (45/35 * 100) */}
      <img 
        src={photoUrl} 
        alt="Processed photo" 
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
    </div>
  );
}