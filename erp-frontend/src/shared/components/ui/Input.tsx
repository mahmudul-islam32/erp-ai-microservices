import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'block w-full rounded-md border shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'px-3 py-2 text-sm',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-400">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

