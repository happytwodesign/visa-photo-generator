import React, { useState } from 'react';
import { Download } from 'lucide-react';
import PrintPreview from './PrintPreview';
import { generateTemplates } from '../lib/templateGenerator';

interface DownloadOptionsProps {
  photoUrl: string;
  onlineSubmissionUrl: string;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({ photoUrl, onlineSubmissionUrl }) => {
  const [selectedSizes, setSelectedSizes] = useState<Set<'online' | 'A4' | 'A5' | 'A6'>>(new Set());
  const [showMessage, setShowMessage] = useState(false);

  const toggleSize = (size: 'online' | 'A4' | 'A5' | 'A6') => {
    setSelectedSizes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(size)) {
        newSet.delete(size);
      } else {
        newSet.add(size);
      }
      return newSet;
    });
    setShowMessage(false);
  };

  const handleDownload = async () => {
    if (selectedSizes.size === 0) {
      setShowMessage(true);
      return;
    }

    if (selectedSizes.has('online')) {
      const link = document.createElement('a');
      link.href = onlineSubmissionUrl;
      link.download = 'schengen_visa_photo_online.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    if (selectedSizes.has('A4') || selectedSizes.has('A5') || selectedSizes.has('A6')) {
      const templates = await generateTemplates(photoUrl);
      templates.forEach((blob, index) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schengen_visa_photo_${['a4', 'a5', 'a6'][index]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }
  };

  return (
    <div className="mt-4 flex flex-col h-full">
      <div className="flex-grow">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {['online', 'A4', 'A5', 'A6'].map((size) => (
            <div key={size}>
              <input
                type="checkbox"
                id={`size-${size}`}
                checked={selectedSizes.has(size as 'online' | 'A4' | 'A5' | 'A6')}
                onChange={() => toggleSize(size as 'online' | 'A4' | 'A5' | 'A6')}
                className="sr-only"
              />
              <label
                htmlFor={`size-${size}`}
                className={`block p-1 border rounded-md cursor-pointer ${
                  selectedSizes.has(size as 'online' | 'A4' | 'A5' | 'A6')
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300'
                }`}
              >
                <PrintPreview 
                  photoUrl={size === 'online' ? onlineSubmissionUrl : photoUrl} 
                  paperSize={size as 'online' | 'A4' | 'A5' | 'A6'}
                />
                <span className="block text-center mt-1 text-sm text-[#0F172A]">{size === 'online' ? 'Online' : size}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button 
          onClick={handleDownload}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center justify-center"
        >
          <Download size={16} className="mr-2" />
          Download Selected
        </button>
      </div>
      {showMessage && (
        <p className="text-gray-500 text-center mt-2">Please select at least one option to download.</p>
      )}
    </div>
  );
};

export default DownloadOptions;