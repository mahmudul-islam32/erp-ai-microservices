import React from 'react';
import { DesignInput } from './DesignInput';

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
      value,
      onChange,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const stringValue = value === undefined || value === null ? '' : String(value);

    const handleChange = (newValue: string) => {
      if (onChange) {
        const syntheticEvent = {
          target: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="w-full">
        <DesignInput
          id={inputId}
          label={label}
          value={stringValue}
          required={required}
          onChange={handleChange}
          className={className}
          {...(props as any)}
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

Input.displayName = 'Input';

