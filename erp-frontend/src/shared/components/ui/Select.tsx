import React from 'react';
import { DesignSelect, Option } from './DesignSelect';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
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
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    const designOptions: Option[] = options.map((opt) => ({
      value: opt.value,
      label: opt.label,
    }));

    return (
      <div className="w-full">
        <DesignSelect
          id={inputId}
          label={label || ''}
          value={stringValue}
          required={required}
          options={designOptions}
          onChange={handleChange}
          className={className}
          fullWidth
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

Select.displayName = 'Select';

