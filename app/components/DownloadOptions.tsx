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
  'online': { grid: [1, 1] as [number, number], scale: 1, aspectRatio: '35 / 45' },
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
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
        {(['online', 'A4', 'A5', 'A6'] as const).map((size) => (
          <div 
            key={size} 
            style={{
              width: `${paperSizeConfig[size].scale * 22}%`,
              aspectRatio: paperSizeConfig[size].aspectRatio,
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
              <PrintPreview 
                photoUrl={size === 'online' ? onlineSubmissionUrl : photoUrl} 
                paperSize={size}
                grid={paperSizeConfig[size].grid}
                isSelected={selectedSize === size} // Pass the isSelected prop
              />
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadOptions;