import React from 'react';

interface PrintPreviewProps {
  photoUrl: string;
  paperSize: 'online' | 'A4' | 'A5' | 'A6';
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ photoUrl, paperSize }) => {
  const getGridDimensions = () => {
    switch (paperSize) {
      case 'online':
        return { cols: 1, rows: 1 };
      case 'A4':
        return { cols: 5, rows: 7 };
      case 'A5':
        return { cols: 3, rows: 5 };
      case 'A6':
        return { cols: 2, rows: 3 };
      default:
        return { cols: 1, rows: 1 };
    }
  };

  const { cols, rows } = getGridDimensions();

  return (
    <div 
      className="grid gap-[1px] bg-white p-1" 
      style={{ 
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        aspectRatio: paperSize === 'online' ? '35 / 45' : '1 / 1.414',
      }}
    >
      {Array.from({ length: cols * rows }).map((_, index) => (
        <div key={index} className="aspect-[35/45] bg-white overflow-hidden">
          <img src={photoUrl} alt="Visa photo" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};

export default PrintPreview;