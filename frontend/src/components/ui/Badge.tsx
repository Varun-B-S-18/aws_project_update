import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
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
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  const variantStyles = {
    default: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  };

  const dotColors = {
    default: 'bg-indigo-400',
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
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

