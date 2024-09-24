import React, { useState, useEffect } from 'react';
import PrintPreview from './PrintPreview';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface DownloadOptionsProps {
  photoUrl: string;
  onlineSubmissionUrl: string;
  onSelectionChange: (selectedSize: 'online' | 'A4' | 'A5' | 'A6' | null) => void;
}

const paperSizeConfig = {
  'online': { grid: [1, 1] as [number, number], scale: 1, aspectRatio: '3 / 4' }, // Updated aspect ratio for 'online'
  'A4': { grid: [5, 5] as [number, number], scale: 1, aspectRatio: '1 / 1.414' },
  'A5': { grid: [3, 4] as [number, number], scale: 0.8, aspectRatio: '1 / 1.414' },
  'A6': { grid: [2, 2] as [number, number], scale: 0.6, aspectRatio: '1 / 1.414' }
};

const DownloadOptions: React.FC<DownloadOptionsProps> = ({ photoUrl, onlineSubmissionUrl, onSelectionChange }) => {
  const [selectedSize, setSelectedSize] = useState<'online' | 'A4' | 'A5' | 'A6' | null>('online');

  useEffect(() => {
    onSelectionChange(selectedSize);
  }, [selectedSize, onSelectionChange]);

  const handleChange = (size: 'online' | 'A4' | 'A5' | 'A6') => {
    setSelectedSize(prevSize => prevSize === size ? null : size);
  };

  return (
    <div className="mt-4">
      <div className="download-options-container" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', alignItems: 'flex-start', height: 'auto', padding: '10px 0' }}>
        {(['online', 'A4', 'A5', 'A6'] as const).map((size) => (
          <div 
            key={size} 
            className="download-option-card"
            style={{
              width: `${paperSizeConfig[size].scale * 22}%`,
              aspectRatio: paperSizeConfig[size].aspectRatio,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Checkbox
              id={`size-${size}`}
              checked={selectedSize === size}
              onCheckedChange={() => handleChange(size)}
              className="sr-only"
            />
            <Label
              htmlFor={`size-${size}`}
              className="block border rounded-md cursor-pointer border-gray-300 hover:border-primary w-full h-full"
            >
              <div className="print-preview-wrapper" style={{ flexGrow: 1 }}>
                <PrintPreview 
                  photoUrl={size === 'online' ? onlineSubmissionUrl : photoUrl} 
                  paperSize={size}
                  grid={paperSizeConfig[size].grid}
                  isSelected={selectedSize === size} // Pass the isSelected prop
                />
              </div>
            </Label>
          </div>
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .download-options-container {
            width: 100%;
            max-width: 350px; /* Adjust this value to match the preview image width */
            margin: 0 auto;
            justify-content: space-between;
            flex-wrap: nowrap;
            height: auto; /* Ensure the container height is auto to fit the cards */
          }
          .download-option-card {
            flex: 1;
            max-width: 22%; /* Ensure all 4 cards fit within one line */
            height: auto; /* Ensure the card height is auto to fit the content */
          }
          .print-preview-wrapper {
            width: 100%;
            height: auto;
            aspect-ratio: ${paperSizeConfig['online'].aspectRatio};
          }
        }
        @media (min-width: 769px) {
          .download-option-card {
            gap: 10px; /* Smaller gap between cards on desktop */
          }
        }
      `}</style>
    </div>
  );
};

export default DownloadOptions;