import React from 'react';
import { Info } from 'lucide-react';

import '@/styles/design-input.css';

type CommonAttributes = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'id'
> &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'id'>;

export interface InputProps extends CommonAttributes {
  id: string;
  type?: string;
  label?: string;
  placeholder?: string;
  value?: string | number | null;
  required?: boolean;
  minLength?: number;
  rows?: number;
  helperText?: string;
  error?: string;
  onInfoClick?: (helpId: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  label = '',
  placeholder = '',
  value = '',
  required = false,
  minLength,
  rows,
  helperText,
  error,
  onInfoClick,
  onChange,
  onValueChange,
  ...rest
}) => {
  const isTextarea = type === 'textarea';
  const stringValue = value === null || value === undefined ? '' : String(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  const infoButtonId = id;

  return (
    <div className="design-input">
      {label && (
        <label htmlFor={id} className="design-input__label">
          {label}
          {required && <span className="design-input__required-asterisk">*</span>}
          {onInfoClick && (
            <button
              type="button"
              className="design-input__label-info"
              onClick={() => onInfoClick(infoButtonId)}
              aria-label={`Show help for ${label}`}
            >
              <Info size={16} />
            </button>
          )}
        </label>
      )}

      {isTextarea ? (
        <textarea
          id={id}
          className="design-input__field"
          placeholder={placeholder}
          value={stringValue}
          required={required}
          rows={rows}
          onChange={handleChange}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          className="design-input__field"
          placeholder={placeholder}
          value={stringValue}
          required={required}
          minLength={minLength}
          onChange={handleChange}
          {...rest}
        />
      )}

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
};

export default Input;
