import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-medium mb-2 flex items-center gap-2">
          <span>{label}</span>
          {props.required && <span className="text-danger-red">*</span>}
        </label>
      )}
      <input
        className={`w-full bg-bg-nature border border-sand-beige/30 text-text-dark px-4 py-3 
          rounded-nature transition-all duration-200 
          placeholder:text-text-medium/50
          focus:outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green/20
          hover:border-primary-green/50 ${className}`}
        {...props}
      />
    </div>
  );
};
