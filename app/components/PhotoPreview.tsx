import React from 'react';

interface PhotoPreviewProps {
  photoUrl: string;
  onRetake: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ photoUrl, onRetake }) => {
  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-grow bg-white rounded-[10px] overflow-hidden" style={{ aspectRatio: '35/45' }}>
        <img src={photoUrl} alt="Processed photo" className="w-full h-full object-contain" />
      </div>
      <div className="mt-4">
        <button onClick={onRetake} className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
          Retake
        </button>
      </div>
    </div>
  );
};

export default PhotoPreview;