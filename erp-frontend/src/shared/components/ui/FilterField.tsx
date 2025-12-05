import React from 'react';
import { Search } from 'lucide-react';

interface FilterFieldProps {
  label: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const FilterField: React.FC<FilterFieldProps> = ({
  label,
  id,
  children,
  className,
}) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
};

interface FilterSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
}

export const FilterSearchInput: React.FC<FilterSearchInputProps> = ({
  label,
  placeholder = 'Search...',
  value,
  onChange,
  id,
  ...props
}) => {
  const inputId = id || 'filter-search';
  
  return (
    <FilterField label={label || 'Search'} id={inputId}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id={inputId}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
          {...props}
        />
      </div>
    </FilterField>
  );
};

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  options,
  placeholder,
  value,
  onChange,
  id,
  ...props
}) => {
  const selectId = id || `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <FilterField label={label} id={selectId}>
      <div className="relative">
        <select
          id={selectId}
          value={value || ''}
          onChange={onChange}
          className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </FilterField>
  );
};

interface FilterTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const FilterTextInput: React.FC<FilterTextInputProps> = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  id,
  ...props
}) => {
  const inputId = id || `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <FilterField label={label} id={inputId}>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        <input
          type="text"
          id={inputId}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out`}
          {...props}
        />
      </div>
    </FilterField>
  );
};

