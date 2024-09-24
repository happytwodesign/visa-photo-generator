import React from 'react';
import { Check } from 'lucide-react';

interface PrintPreviewProps {
  photoUrl: string;
  paperSize: 'online' | 'A4' | 'A5' | 'A6';
  grid: [number, number];
  isSelected: boolean; // Add a prop to indicate if the card is selected
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ photoUrl, paperSize, grid, isSelected }) => {
  const [cols, rows] = grid;
  const aspectRatio = paperSize === 'online' ? '35 / 45' : '1 / 1.414'; // Set 'online' to match passport photo aspect ratio
  const gapSize = '1px';
  const gridPadding = '4px';
  const photoSize = '20px';
  const labelHeight = paperSize === 'online' ? '40px' : '22px'; // Add more space for 'online' to fit the title and checkmark

  return (
    <div
      className="w-full bg-white overflow-hidden rounded-md"
      style={{
        aspectRatio,
        padding: gridPadding,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: paperSize === 'online' ? '1fr' : `repeat(${cols}, ${photoSize})`,
          gridTemplateRows: paperSize === 'online' ? '1fr' : `repeat(${rows}, ${photoSize})`,
          gap: gapSize,
          justifyContent: 'center',
          alignContent: 'center',
          flexGrow: 1,
          height: `calc(100% - ${labelHeight})`,
        }}
      >
        {paperSize === 'online' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <img
              src={photoUrl}
              alt="Visa photo"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          Array.from({ length: cols * rows }).map((_, index) => (
            <div
              key={index}
              style={{
                width: photoSize,
                height: photoSize,
                overflow: 'hidden',
              }}
            >
              <img
                src={photoUrl}
                alt="Visa photo"
                className="w-full h-full object-cover"
              />
            </div>
          ))
        )}
      </div>
      <div
        className="flex items-center justify-center mt-1 px-2"
        style={{
          fontSize: '14px',
          padding: '4px 0',
          height: labelHeight,
        }}
      >
        <span className="text-[#0F172A]">{paperSize === 'online' ? 'Online' : paperSize}</span>
        {isSelected && (
          <Check size={16} className="ml-1 text-primary" />
        )}
      </div>
    </div>
  );
};

export default PrintPreview;