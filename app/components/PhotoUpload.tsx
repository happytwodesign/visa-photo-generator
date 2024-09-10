import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X } from 'lucide-react'; // Assuming you're using lucide-react for icons

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  uploadedPhotoUrl: string | null;
  onDelete: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUpload, uploadedPhotoUrl, onDelete }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': []},
    noClick: false, // Ensure click is enabled
    noKeyboard: false // Allow keyboard navigation
  });

  return (
    <div 
      {...getRootProps()} 
      className="relative w-full h-full cursor-pointer"
    >
      <input {...getInputProps()} />
      {uploadedPhotoUrl ? (
        <>
          <img 
            src={uploadedPhotoUrl} 
            alt="Uploaded photo" 
            className="w-full h-full object-cover"
          />
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering dropzone click
              onDelete();
            }}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Remove photo"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </>
      ) : (
        <div className="bg-gray-100 w-full h-full rounded-[10px] flex flex-col items-center justify-center">
          <p className="text-lg mb-2">
            {isDragActive ? "Drop the photo here" : "Click to upload your photo"}
          </p>
          <p className="text-sm text-gray-500">
            {isDragActive ? "" : "or drag and drop it here"}
          </p>
          <p className="text-xs text-gray-400 mt-2">PNG & JPG</p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;