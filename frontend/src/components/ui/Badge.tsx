import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'sage' | 'deepGreen' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  const variantStyles = {
    default: 'bg-[#A9B887]/25 text-[#2E3D28] border-[#A9B887]/50',
    sage: 'bg-[#A9B887]/30 text-[#2E3D28] border-[#A9B887]/60 font-medium',
    deepGreen: 'bg-[#2E3D28] text-[#E8E9DF] border-[#2E3D28] font-medium',
    indigo: 'bg-[#A9B887]/20 text-[#2E3D28] border-[#A9B887]/40',
    emerald: 'bg-[#A9B887]/30 text-[#2E3D28] border-[#A9B887]/60 font-medium',
    amber: 'bg-[#c2aa70]/25 text-[#2E3D28] border-[#c2aa70]/40',
    rose: 'bg-rose-100 text-rose-900 border-rose-300',
    slate: 'bg-[#2E3D28]/10 text-[#2E3D28] border-[#2E3D28]/20',
  };

  const dotColors = {
    default: 'bg-[#2E3D28]',
    sage: 'bg-[#2E3D28]',
    deepGreen: 'bg-[#A9B887]',
    indigo: 'bg-[#2E3D28]',
    emerald: 'bg-[#2E3D28]',
    amber: 'bg-[#c2aa70]',
    rose: 'bg-rose-600',
    slate: 'bg-[#2E3D28]/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
