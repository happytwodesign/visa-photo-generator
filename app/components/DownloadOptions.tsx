import React from 'react';

interface DownloadOptionsProps {
  photoUrl: string;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({ photoUrl }) => {
  const options = ['Single Photo', 'A4 Template', 'A5 Template', 'A6 Template'];

  return (
    <div className="mt-4">
      <div className="flex justify-between">
        {options.map((option, index) => (
          <div key={index} className="w-1/4 px-1">
            <div className="border rounded p-2 text-center">
              <img src={photoUrl} alt={option} className="w-full h-auto mb-2" />
              <p className="text-sm">{option}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadOptions;