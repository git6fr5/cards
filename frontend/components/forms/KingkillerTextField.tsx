'use client';
import { useState } from 'react';
import type { ChangeEvent } from 'react';

interface KingkillerTextFieldProps {
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

export default function KingkillerTextField({ id, label, value, onChange, name, type = 'text', placeholder, disabled = false, required = false, autoComplete, autoFocus, error, className = '' }: KingkillerTextFieldProps) {
  const [internalError, setInternalError] = useState('');

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
      {label && <label htmlFor={id} className="text-sm font-medium text-kingkiller-black">{label}</label>}
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
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-kingkiller-gold disabled:opacity-disabled disabled:cursor-not-allowed ${displayError ? 'border-kingkiller-crimson' : 'border-kingkiller-black'}`}
      />
      {displayError && <p className="text-xs text-kingkiller-crimson">{displayError}</p>}
    </div>
  );
}
