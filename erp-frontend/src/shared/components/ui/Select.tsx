import React, { useId, useMemo, useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

import '@/styles/design-select.css';

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'id'> {
  /** Optional. Falls back to a generated id so the label stays associated. */
  id?: string;
  label: string;
  value?: string;
  required?: boolean;
  options: Option[];
  sortOptions?: boolean;
  fullWidth?: boolean;
  error?: string;
  helperText?: string;
  onInfoClick?: (helpId: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  helpId?: string;
}

export const Select: React.FC<SelectProps> = ({
  id: providedId,
  label,
  value = '',
  required = false,
  options,
  sortOptions = false,
  fullWidth = false,
  error,
  helperText,
  onInfoClick,
  onChange,
  onValueChange,
  helpId,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedOptions = useMemo(() => {
    if (sortOptions) {
      return [...options].sort((a, b) => a.label.localeCompare(b.label));
    }
    return options;
  }, [options, sortOptions]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setIsOpen(false);
    onChange?.(event);
    onValueChange?.(newValue);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    setIsOpen(false);
  };

  const generatedId = useId();
  const id = providedId ?? generatedId;
  const infoButtonId = helpId || id;

  return (
    <div className={`design-select ${fullWidth ? 'design-select--full-width' : ''}`}>
      <label htmlFor={id} className="design-select__label">
        {label}
        {required && <span className="design-select__required-asterisk">*</span>}
        {onInfoClick && (
          <button
            type="button"
            className="design-select__label-info"
            onClick={() => onInfoClick(infoButtonId)}
            aria-label={`Show help for ${label}`}
          >
            <Info size={16} />
          </button>
        )}
      </label>

      <div className="design-select__field-wrapper">
        <div className="design-select__wrapper">
          <select
            id={id}
            className="design-select__field"
            value={value}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...rest}
          >
            {sortedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span className="design-select__icon">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </div>
      </div>

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

export default Select;
