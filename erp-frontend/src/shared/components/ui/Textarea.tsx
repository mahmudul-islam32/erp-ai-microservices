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
    // A textarea's value type includes readonly string[]; Input takes a scalar.
    const scalarValue =
      typeof value === 'string' || typeof value === 'number' ? value : value?.join('\n');

    return (
      <div className="w-full">
        <Input
          // Input renders either an input or a textarea, so its ref type is the
          // intersection; this wrapper only ever renders the textarea branch.
          ref={ref as React.Ref<HTMLInputElement & HTMLTextAreaElement>}
          id={id || label?.toLowerCase().replace(/\s+/g, '-') || 'textarea'}
          type="textarea"
          label={label}
          value={scalarValue}
          required={required}
          onChange={onChange as any}
          onValueChange={(val) =>
            onChange?.({
              target: { value: val }
            } as React.ChangeEvent<HTMLTextAreaElement>)
          }
          className={className}
          // Input's props intersect input and textarea attributes, so textarea
          // event handlers are not structurally assignable to that intersection.
          {...(props as Record<string, unknown>)}
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

