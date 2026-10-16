import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  startIcon,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const actualType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {startIcon && (
          <span className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center">
            {startIcon}
          </span>
        )}

        <input
          id={inputId}
          type={actualType}
          className={`w-full rounded-xl bg-slate-950/80 border ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500/80 focus:ring-indigo-500/20'
          } px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
            startIcon ? 'pl-10' : ''
          } ${showPasswordToggle ? 'pr-10' : ''} ${className}`}
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded focus:outline-none"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <span className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-0.5">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] text-slate-500 mt-0.5">{hint}</span>
      ) : null}
    </div>
  );
};

