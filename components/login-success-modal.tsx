'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginSuccessModal({ isOpen, onClose }: LoginSuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 100);
      // Delay checkmark animation for dramatic effect
      const checkmarkTimer = setTimeout(() => setShowCheckmark(true), 400);
      return () => {
        clearTimeout(timer);
        clearTimeout(checkmarkTimer);
      };
    } else {
      setIsVisible(false);
      setShowCheckmark(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Card className={`w-full max-w-sm mx-4 p-8 bg-white border-gray-200 shadow-lg transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Animated Checkmark */}
          <div className="checkmark-circle">
            {showCheckmark && <div className="checkmark-icon"></div>}
          </div>
          
          {/* Success Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Success
            </h2>
            <p className="text-gray-600">
              Your data was saved!
            </p>
          </div>
        </div>

        {/* OK Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-sm"
          >
            OK
          </Button>
        </div>
      </Card>
    </div>
  );
}
