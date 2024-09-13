import React, { useState, useEffect } from 'react';
import PrintPreview from './PrintPreview';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Check } from 'lucide-react';

interface DownloadOptionsProps {
  photoUrl: string;
  onlineSubmissionUrl: string;
  onSelectionChange: (selectedSize: 'online' | 'A4' | 'A5' | 'A6' | null) => void;
}

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
      <div className="grid grid-cols-4 gap-4 mb-4">
        {['online', 'A4', 'A5', 'A6'].map((size) => (
          <div key={size} className="relative">
            <Checkbox
              id={`size-${size}`}
              checked={selectedSize === size}
              onCheckedChange={() => handleChange(size as 'online' | 'A4' | 'A5' | 'A6')}
              className="sr-only"
            />
            <Label
              htmlFor={`size-${size}`}
              className="block p-1 border rounded-md cursor-pointer border-gray-300 hover:border-primary"
            >
              <PrintPreview 
                photoUrl={size === 'online' ? onlineSubmissionUrl : photoUrl} 
                paperSize={size as 'online' | 'A4' | 'A5' | 'A6'}
              />
              <div className="flex items-center justify-center mt-1">
                {selectedSize === size && (
                  <Check size={16} className="mr-1 text-primary" />
                )}
                <span className="text-sm text-[#0F172A]">{size === 'online' ? 'Online' : size}</span>
              </div>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadOptions;