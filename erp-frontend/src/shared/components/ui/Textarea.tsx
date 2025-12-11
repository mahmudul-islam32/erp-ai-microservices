import React from 'react';
import { Input } from '@/shared/components/ui/Input';

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
      value,
      onChange,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <Input
          id={id || label?.toLowerCase().replace(/\s+/g, '-') || 'textarea'}
          type="textarea"
          label={label}
          value={value}
          required={required}
          onChange={onChange as any}
          onValueChange={(val) =>
            onChange?.({
              target: { value: val },
            } as React.ChangeEvent<HTMLTextAreaElement>)
          }
          className={className}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--status-error)' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

