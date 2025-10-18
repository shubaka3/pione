import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-5 py-2.5 font-medium rounded-nature transition-all duration-200 border shadow-sm cursor-pointer active:scale-95';
  
  const variantStyles = {
    primary: 'bg-primary-green text-white border-primary-green/20 hover:bg-secondary-green shadow-nature',
    secondary: 'bg-cloud-white text-primary-green border-primary-green hover:bg-primary-green hover:text-white',
    success: 'bg-success-green text-white border-success-green/20 hover:brightness-110 shadow-nature',
    danger: 'bg-danger-red/90 text-white border-danger-red/20 hover:bg-danger-red shadow-nature',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
