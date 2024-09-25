import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface EmailPhotosModalProps {
  onClose: () => void;
  onSend: (email: string) => void;
}

export function EmailPhotosModal({ onClose, onSend }: EmailPhotosModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Reset email and error when the modal is opened
  useEffect(() => {
    setEmail('');
    setError('');
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSend = () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    onSend(email);
    // Reset email and error after sending
    setEmail('');
    setError('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Send Photos via Email</h2>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  );
}