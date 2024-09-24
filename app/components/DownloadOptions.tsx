import React, { useState, useEffect } from 'react';
import PrintPreview from './PrintPreview';
import { generateTemplates } from '../lib/templateGenerator';
import { Label } from './ui/label'; // Correct import statement for Label

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
  console.log('DownloadOptions received photoUrl:', photoUrl);
  
  const [selectedSize, setSelectedSize] = useState<'online' | 'A4' | 'A5' | 'A6' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hoveredSize, setHoveredSize] = useState<'online' | 'A4' | 'A5' | 'A6' | null>(null);

  useEffect(() => {
    onSelectionChange(selectedSize);
  }, [selectedSize, onSelectionChange]);

  const handleChange = async (size: 'online' | 'A4' | 'A5' | 'A6') => {
    setSelectedSize(size);
    setIsDownloading(true);

    if (size === 'online') {
      const link = document.createElement('a');
      link.href = photoUrl;
      link.download = 'schengen_visa_photo_online.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        const templates = await generateTemplates(photoUrl);
        const paperSizes = ['A4', 'A5', 'A6'];
        const blob = templates[paperSizes.indexOf(size)];
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schengen_visa_photo_${size.toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating templates:', error);
      }
    }

    // Provide feedback by highlighting the card
    setTimeout(() => {
      setSelectedSize(null);
      setIsDownloading(false);
    }, 2000); // Remove highlight after 2 seconds
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
            onMouseEnter={() => setHoveredSize(size)}
            onMouseLeave={() => setHoveredSize(null)}
            onClick={() => handleChange(size)} // Handle click to start download
          >
            <Label
              htmlFor={`size-${size}`}
              className="block rounded-md cursor-pointer w-full h-full"
            >
              <div className="print-preview-wrapper" style={{ flexGrow: 1 }}>
                <PrintPreview 
                  photoUrl={size === 'online' ? onlineSubmissionUrl : photoUrl} 
                  paperSize={size}
                  grid={paperSizeConfig[size].grid}
                  isDownloading={isDownloading && selectedSize === size}
                  isHovered={hoveredSize === size}
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