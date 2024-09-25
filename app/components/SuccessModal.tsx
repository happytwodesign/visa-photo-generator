import React from 'react';
import { Button } from './ui/button';
import { Check } from 'lucide-react';

interface SuccessModalProps {
  email: string;
  onClose: () => void;
}

export function SuccessModal({ email, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
        <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-xl font-semibold mb-2">Photos sent to</p>
        <p className="text-lg mb-6">{email}</p>
        <Button onClick={onClose} className="px-8">
          Thanks
        </Button>
      </div>
    </div>
  );
}