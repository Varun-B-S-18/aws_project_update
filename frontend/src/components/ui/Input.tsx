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
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-slate-900 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
              icon ? 'pl-9 pr-3.5 py-2' : 'px-3.5 py-2'
            } ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-indigo-500/80 focus:ring-indigo-500/30'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-[11px] text-rose-400 leading-tight">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-slate-500 leading-tight">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

