import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X } from 'lucide-react'; // Assuming you're using lucide-react for icons

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  uploadedPhotoUrl: string | null;
  onDelete: () => void;
}

const PhotoUpload = React.memo(({ onUpload, uploadedPhotoUrl, onDelete }: PhotoUploadProps) => {
  // Add console logs to check if the component is rendering and responding to events
  console.log('PhotoUpload rendering', { uploadedPhotoUrl });

  const handleUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Upload event triggered');
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      onUpload(file);
    }
  }, [onUpload]);

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
    <div {...getRootProps()} className="absolute inset-0">
      <input {...getInputProps()} />
      {uploadedPhotoUrl ? (
        <div className="relative w-full h-full rounded-[10px] overflow-hidden"> {/* Added rounded-[10px] and overflow-hidden */}
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
        </div>
      ) : (
        <div className="bg-gray-100 w-full h-full rounded-[10px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
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
});

export default PhotoUpload;
