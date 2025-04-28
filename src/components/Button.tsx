import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  isLoading = false,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variant === 'primary' ? 'app-button' : 'app-button-secondary'}
        ${className} text-white
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : icon ? (
        icon
      ) : null}
      <span className="text-white">{children}</span>
    </button>
  );
}