import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-forest/80 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-bg-nature border border-sand-beige/20 rounded-nature w-full max-w-2xl p-6 relative shadow-nature">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary-green rounded-full"></div>
            <h3 className="text-2xl font-bold text-text-dark">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-medium hover:text-primary-green transition-colors p-2 hover:bg-primary-green/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>
        <div className="text-sm space-y-3 text-text-medium">
          {children}
        </div>
      </div>
    </div>
  );
};
