import type { ChangeEvent } from 'react';

interface KingkillerDatePickerProps {
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

export default function KingkillerDatePicker({ id, label, value, onChange, min, max, disabled = false, error, className = '' }: KingkillerDatePickerProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-kingkiller-black">{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-kingkiller-gold disabled:opacity-disabled disabled:cursor-not-allowed ${error ? 'border-kingkiller-crimson' : 'border-kingkiller-black'}`}
      />
      {error && <p className="text-xs text-kingkiller-crimson">{error}</p>}
    </div>
  );
}
