import React from 'react';

import '@/styles/design-checkbox.css';

export interface DesignCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange' | 'id'> {
  id: string;
  label: string;
  checked: boolean;
  required?: boolean;
  onChange?: (checked: boolean) => void;
}

export const DesignCheckbox: React.FC<DesignCheckboxProps> = ({
  id,
  label,
  checked,
  required = false,
  onChange,
  ...rest
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <label className="design-checkbox">
      <input
        id={id}
        type="checkbox"
        className="design-checkbox__input"
        checked={checked}
        required={required}
        onChange={handleChange}
        {...rest}
      />
      <span className="design-checkbox__label">
        {label}
        {required && <span className="design-checkbox__required-asterisk">*</span>}
      </span>
    </label>
  );
};

export default DesignCheckbox;
