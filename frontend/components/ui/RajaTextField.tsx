'use client';
import { useState } from 'react';
import type { ChangeEvent } from 'react';

interface RajaTextFieldProps {
  alt?: boolean;
  id: string;
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string;
  className?: string;
}

export default function RajaTextField({ alt = false, id, label, value, onChange, name, type = 'text', placeholder, disabled = false, required = false, autoComplete, autoFocus, error, className = '' }: RajaTextFieldProps) {
  const [internalError, setInternalError] = useState('');

  const labelColor = alt ? 'text-raja-chrome-bg' : 'text-raja-chrome-text';

  const handleBlur = () => {
    if (type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInternalError('Enter a valid email address');
    } else {
      setInternalError('');
    }
  };

  const displayError = error ?? internalError;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label htmlFor={id} className={`text-sm font-medium ${labelColor}`}>{label}</label>}
      <input
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`w-full px-3 py-2 border bg-raja-chrome-bg text-raja-chrome-text text-sm focus:outline-none focus:ring-2 focus:ring-raja-chrome-action disabled:opacity-disabled disabled:cursor-not-allowed ${displayError ? 'border-raja-chrome-error' : 'border-raja-chrome-border'}`}
      />
      {displayError && <p className="text-xs text-raja-chrome-error">{displayError}</p>}
    </div>
  );
}
