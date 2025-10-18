import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-bg-nature border border-sand-beige/20 rounded-nature shadow-nature 
        hover:shadow-nature-hover transition-all duration-300 backdrop-blur-sm
        ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-primary-green/30' : ''} 
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
