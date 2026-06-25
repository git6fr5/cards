import type { ChangeEvent } from 'react';

interface ProjectDatePickerProps {
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

export default function ProjectDatePicker({ id, label, value, onChange, min, max, disabled = false, error, className = '' }: ProjectDatePickerProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-project-black">{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-project-black disabled:opacity-disabled disabled:cursor-not-allowed ${error ? 'border-project-red' : 'border-project-black'}`}
      />
      {error && <p className="text-xs text-project-red">{error}</p>}
    </div>
  );
}
