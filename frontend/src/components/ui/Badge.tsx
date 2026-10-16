import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    indigo: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-800/80',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    rose: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  };

  const dotColors = {
    indigo: 'bg-indigo-400',
    purple: 'bg-purple-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};

