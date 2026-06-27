'use client';
import type { ChangeEvent } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface KingkillerDropdownProps {
  id: string;
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function KingkillerDropdown({ id, label, options, value, onChange, placeholder, disabled = false, required = false, error, className = '' }: KingkillerDropdownProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label htmlFor={id} className="text-sm font-medium text-kingkiller-black">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-kingkiller-gold disabled:opacity-disabled disabled:cursor-not-allowed ${error ? 'border-kingkiller-crimson' : 'border-kingkiller-black'}`}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-kingkiller-crimson">{error}</p>}
    </div>
  );
}
