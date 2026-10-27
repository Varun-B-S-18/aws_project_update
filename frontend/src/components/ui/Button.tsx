import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#E8E9DF] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#A9B887] hover:bg-[#99a977] text-[#2E3D28] font-semibold border border-[#2E3D28]/20 shadow-sm focus:ring-[#A9B887]',
    secondary:
      'bg-[#2E3D28] hover:bg-[#3d4f36] text-[#E8E9DF] font-medium border border-[#2E3D28] shadow-sm focus:ring-[#2E3D28]',
    outline:
      'bg-transparent hover:bg-[#A9B887]/20 text-[#2E3D28] border border-[#2E3D28]/30 focus:ring-[#A9B887]',
    ghost:
      'bg-transparent hover:bg-[#A9B887]/15 text-[#2E3D28] border border-transparent focus:ring-[#A9B887]',
    danger:
      'bg-rose-700 hover:bg-rose-600 text-[#E8E9DF] shadow-sm focus:ring-rose-600 border border-rose-800',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
