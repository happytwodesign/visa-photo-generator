import React from 'react';

interface PrintPreviewProps {
  photoUrl: string;
  paperSize: 'online' | 'A4' | 'A5' | 'A6';
  grid: [number, number];  // Add this line
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ photoUrl, paperSize, grid }) => {
  const [cols, rows] = grid;  // Add this line
  const aspectRatio = paperSize === 'online' ? '35 / 45' : '1 / 1.414';

  return (
    <div 
      className="w-full bg-white"
      style={{ 
        aspectRatio,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,  // Use cols here
        gridTemplateRows: `repeat(${rows}, 1fr)`,     // Use rows here
        gap: '1px',
      }}
    >
      {Array.from({ length: cols * rows }).map((_, index) => (
        <div key={index} style={{ aspectRatio: '35 / 45', overflow: 'hidden' }}>
          <img 
            src={photoUrl} 
            alt="Visa photo" 
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default PrintPreview;