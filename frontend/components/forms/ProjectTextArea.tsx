'use client';
import type { ChangeEvent, ReactNode } from 'react';

interface ProjectTextAreaProps {
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

export default function ProjectTextArea({ id, label, value, onChange, name, rows = 4, placeholder, disabled = false, required = false, error, renderOverlay, className = '' }: ProjectTextAreaProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label htmlFor={id} className="text-sm font-medium text-project-black">{label}</label>}
      <textarea
        id={id}
        name={name ?? id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-project-black resize-none disabled:opacity-disabled disabled:cursor-not-allowed ${error ? 'border-project-red' : 'border-project-black'}`}
      />
      {renderOverlay?.(value)}
      {error && <p className="text-xs text-project-red">{error}</p>}
    </div>
  );
}
