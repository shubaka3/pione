import React from 'react';

interface LoaderProps {
  isVisible: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-100 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white border-b-blue-500 rounded-full animate-spin" />
    </div>
  );
};
