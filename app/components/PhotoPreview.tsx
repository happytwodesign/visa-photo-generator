import React from 'react';

export default function PhotoPreview({ photoUrl }) {
  return (
    <div className="w-full h-full">
      <img 
        src={photoUrl} 
        alt="Processed photo" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}