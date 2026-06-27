'use client';
import type { ChangeEvent, ReactNode } from 'react';

interface KingkillerTextAreaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  renderOverlay?: (value: string) => ReactNode;
  className?: string;
}

export default function KingkillerTextArea({ id, label, value, onChange, name, rows = 4, placeholder, disabled = false, required = false, error, renderOverlay, className = '' }: KingkillerTextAreaProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label htmlFor={id} className="text-sm font-medium text-kingkiller-black">{label}</label>}
      <textarea
        id={id}
        name={name ?? id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-kingkiller-gold resize-none disabled:opacity-disabled disabled:cursor-not-allowed ${error ? 'border-kingkiller-crimson' : 'border-kingkiller-black'}`}
      />
      {renderOverlay?.(value)}
      {error && <p className="text-xs text-kingkiller-crimson">{error}</p>}
    </div>
  );
}
