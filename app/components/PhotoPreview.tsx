import React from 'react';
import Image from 'next/image';

interface PhotoPreviewProps {
  photoUrl: string;
}

export default function PhotoPreview({ photoUrl }: PhotoPreviewProps) {
  return (
    <div className="flex-grow bg-white rounded-[10px] overflow-hidden relative" style={{ aspectRatio: '35/45' }}>
      <Image
        src={photoUrl}
        alt="Processed photo"
        layout="fill"
        objectFit="contain"
      />
    </div>
  );
}