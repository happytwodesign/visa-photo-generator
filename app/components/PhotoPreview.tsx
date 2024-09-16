import React from 'react';

interface PhotoPreviewProps {
  photoUrl: string;
}

export default function PhotoPreview({ photoUrl }: PhotoPreviewProps) {
  return (
    <div className="w-full h-0 pb-[128.57%] relative bg-gray-100 rounded-[10px] overflow-hidden"> {/* Added rounded-[10px] and overflow-hidden */}
      <img 
        src={photoUrl} 
        alt="Processed photo" 
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
    </div>
  );
}