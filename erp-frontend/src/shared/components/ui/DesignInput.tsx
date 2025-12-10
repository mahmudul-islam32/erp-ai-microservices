import React from 'react';
import { Info } from 'lucide-react';

import '@/styles/design-input.css';

type CommonAttributes = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'id'
> &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'id'>;

export interface DesignInputProps extends CommonAttributes {
  id: string;
  type?: string;
  label?: string;
  placeholder?: string;
  value: string;
  required?: boolean;
  minlength?: number;
  rows?: number;
  onInfoClick?: (helpId: string) => void;
  onChange: (value: string) => void;
}

export const DesignInput: React.FC<DesignInputProps> = ({
  id,
  type = 'text',
  label = '',
  placeholder = '',
  value,
  required = false,
  minlength,
  rows,
  onInfoClick,
  onChange,
  ...rest
}) => {
  const isTextarea = type === 'textarea';

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value);
  };

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
              onClick={() => onInfoClick(id)}
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
          value={value}
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
          value={value}
          required={required}
          minLength={minlength}
          onChange={handleChange}
          {...rest}
        />
      )}
    </div>
  );
};

export default DesignInput;
