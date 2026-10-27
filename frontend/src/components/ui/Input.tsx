import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#2E3D28]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[#2E3D28]/60 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#E8E9DF] border rounded-xl text-sm text-[#2E3D28] placeholder-[#2E3D28]/45 focus:outline-none focus:ring-2 transition-all ${
              icon ? 'pl-9 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
            } ${
              error
                ? 'border-rose-600 focus:border-rose-600 focus:ring-rose-500/20'
                : 'border-[#2E3D28]/25 focus:border-[#A9B887] focus:ring-[#A9B887]/30'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-[11px] text-rose-700 leading-tight">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[#2E3D28]/60 leading-tight">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
