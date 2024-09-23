import React from 'react';

interface PrintPreviewProps {
  photoUrl: string;
  paperSize: 'online' | 'A4' | 'A5' | 'A6';
  grid: [number, number];
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ photoUrl, paperSize, grid }) => {
  const [cols, rows] = grid;
  const aspectRatio = paperSize === 'online' ? '35 / 45' : '1 / 1.414';
  const gapSize = '1px'; // Adjust this value to change both row and column gaps

  return (
    <div
      className="w-full bg-white overflow-hidden rounded-md"
      style={{
        aspectRatio,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: gapSize,
        padding: gapSize,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const isFirstRow = row === 0;
        const isLastRow = row === rows - 1;
        const isFirstCol = col === 0;
        const isLastCol = col === cols - 1;
        
        return (
          <div 
            key={index} 
            style={{
              aspectRatio: '35 / 45',
              overflow: 'hidden',
              borderRadius: `${isFirstRow && isFirstCol ? '4px' : '0'} ${isFirstRow && isLastCol ? '4px' : '0'} ${isLastRow && isLastCol ? '4px' : '0'} ${isLastRow && isFirstCol ? '4px' : '0'}`,
            }}
          >
            <img
              src={photoUrl}
              alt="Visa photo"
              className="w-full h-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
};

export default PrintPreview;