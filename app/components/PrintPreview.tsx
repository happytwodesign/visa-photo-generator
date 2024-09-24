import React from 'react';
import { Download, Check } from 'lucide-react';

interface PrintPreviewProps {
  photoUrl: string;
  paperSize: 'online' | 'A4' | 'A5' | 'A6';
  grid: [number, number];
  isDownloading: boolean;
  isHovered: boolean;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ photoUrl, paperSize, grid, isDownloading, isHovered }) => {
  const [cols, rows] = grid;
  const aspectRatio = paperSize === 'online' ? '3 / 4' : '1 / 1.414'; // Updated aspect ratio for 'online'
  const gapSize = '1px';
  const gridPadding = '4px';
  const photoSize = '20px';
  const borderRadius = '2px'; // Define the border radius

  return (
    <div
      className={`w-full bg-white overflow-hidden rounded-md print-preview-container ${isHovered ? 'hovered' : ''}`}
      style={{
        padding: gridPadding,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        justifyContent: 'flex-start', // Align content to the top
        border: isHovered ? '1px solid #0F1729' : '1px solid #ccc', // Change border color on hover
      }}
    >
      <div
        className="print-preview-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: paperSize === 'online' ? '1fr' : `repeat(${cols}, ${photoSize})`,
          gridTemplateRows: paperSize === 'online' ? '1fr' : `repeat(${rows}, ${photoSize})`,
          gap: gapSize,
          justifyContent: 'center',
          alignContent: 'center',
          flexGrow: 1,
          paddingTop: paperSize === 'online' ? '0' : '4px', // Add padding to the top for A4, A5, and A6
        }}
      >
        {paperSize === 'online' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius, aspectRatio }}>
            <img
              src={photoUrl}
              alt="Visa photo"
              className="w-full h-full object-cover"
              style={{ borderRadius }}
            />
          </div>
        ) : (
          Array.from({ length: cols * rows }).map((_, index) => {
            const isFirstRow = index < cols;
            const isLastRow = index >= cols * (rows - 1);
            const isFirstCol = index % cols === 0;
            const isLastCol = index % cols === cols - 1;

            const borderRadiusStyle = {
              borderTopLeftRadius: isFirstRow && isFirstCol ? borderRadius : '0',
              borderTopRightRadius: isFirstRow && isLastCol ? borderRadius : '0',
              borderBottomLeftRadius: isLastRow && isFirstCol ? borderRadius : '0',
              borderBottomRightRadius: isLastRow && isLastCol ? borderRadius : '0',
            };

            return (
              <div
                key={index}
                style={{
                  width: photoSize,
                  height: photoSize,
                  overflow: 'hidden',
                  ...borderRadiusStyle,
                }}
              >
                <img
                  src={photoUrl}
                  alt="Visa photo"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 'inherit' }}
                />
              </div>
            );
          })
        )}
      </div>
      <div
        className="flex items-center justify-center mt-1 px-2"
        style={{
          fontSize: '14px',
          padding: '4px 0',
        }}
      >
        <span className="text-[#0F172A]">{paperSize === 'online' ? 'Online' : paperSize}</span>
        {isHovered && !isDownloading && (
          <Download size={16} className="ml-1 text-primary" />
        )}
        {isDownloading && (
          <Check size={16} className="ml-1 text-primary" />
        )}
      </div>
    </div>
  );
};

export default PrintPreview;