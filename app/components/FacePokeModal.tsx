import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useMediaQuery } from '../../hooks/useMediaQuery';
// import { FacePoke } from '@/lib/facepoke';

interface FacePokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedPhotoUrl: string) => void;
  currentPhotoUrl: string;
}

interface FacePokeControls {
  smile: number;
  eyebrows: number;
  eyes: number;
  faceHorizontal: number;
  faceVertical: number;
  headTurn: number;
  mouth: number;
}

const FacePokeModal: React.FC<FacePokeModalProps> = ({ isOpen, onClose, onSave, currentPhotoUrl }) => {
  const [editedPhotoUrl, setEditedPhotoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [controls, setControls] = useState<FacePokeControls>({
    smile: 0,
    eyebrows: 0,
    eyes: 0,
    faceHorizontal: 0,
    faceVertical: 0,
    headTurn: 0,
    mouth: 0,
  });
  const facePokeRef = useRef<any>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (isOpen && currentPhotoUrl) {
      const img = new Image();
      img.onload = () => {
        setAspectRatio(img.height / img.width);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          initializeFacePoke(canvas);
        }
      };
      img.src = currentPhotoUrl;
    }
  }, [isOpen, currentPhotoUrl]);

  useEffect(() => {
    applyFacePoke();
  }, [controls]);

  const initializeFacePoke = async (canvas: HTMLCanvasElement) => {
    try {
      // Initialize FacePoke
      // facePokeRef.current = new FacePoke(canvas);
      // await facePokeRef.current.initialize();
      console.log('FacePoke initialized');
    } catch (error) {
      console.error('Error initializing FacePoke:', error);
    }
  };

  const applyFacePoke = async () => {
    if (!facePokeRef.current) {
      console.error('FacePoke not initialized');
      return;
    }

    try {
      // Apply transformations
      // await facePokeRef.current.applyTransformation(controls);
      // const transformedImageUrl = await facePokeRef.current.getTransformedImageUrl();
      // setEditedPhotoUrl(transformedImageUrl);
      console.log('FacePoke transformation applied:', controls);
    } catch (error) {
      console.error('Error applying FacePoke transformation:', error);
    }
  };

  const handleControlChange = (control: keyof FacePokeControls, value: number) => {
    setControls(prev => ({ ...prev, [control]: value }));
  };

  const handleApply = () => {
    if (editedPhotoUrl) {
      onSave(editedPhotoUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
      <div className={`bg-white ${isMobile ? 'w-full h-full' : 'w-[70%] h-[90%] rounded-lg'} flex flex-col overflow-hidden`}>
        <div className="flex-grow overflow-y-auto p-4 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Face Correction</h2>
          <div className={`${isMobile ? 'w-[65%]' : 'w-full'} mx-auto flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            <div className={`${isMobile ? 'w-full' : 'w-1/2'} mb-6`}>
              <div 
                style={{ 
                  paddingBottom: `${aspectRatio * 100}%`, 
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden'
                }}
              >
                <canvas 
                  ref={canvasRef} 
                  className="absolute top-0 left-0 w-full h-full border border-gray-300"
                ></canvas>
              </div>
            </div>
            <div className={`${isMobile ? 'w-full' : 'w-1/2'} space-y-6`}>
              {Object.entries(controls).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <Slider
                    min={-50}
                    max={50}
                    step={1}
                    value={[value]}
                    onValueChange={(newValue) => handleControlChange(key as keyof FacePokeControls, newValue[0])}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 flex justify-end space-x-4 border-t">
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </div>
  );
};

export default FacePokeModal;