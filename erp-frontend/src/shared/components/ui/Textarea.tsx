import React from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
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
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-md border shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
              : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            'px-3 py-2 text-sm',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

