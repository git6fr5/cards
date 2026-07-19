import type { ChangeEvent } from 'react';

interface RajaDatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function RajaDatePicker({ id, label, value, onChange, min, max, disabled = false, error, className = '' }: RajaDatePickerProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-raja-chrome-text">{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-raja-chrome-action disabled:opacity-disabled disabled:cursor-not-allowed ${error ? 'border-raja-chrome-error' : 'border-raja-chrome-border'}`}
      />
      {error && <p className="text-xs text-raja-chrome-error">{error}</p>}
    </div>
  );
}
