'use client';
import type { ChangeEvent } from 'react';

interface KingkillerCheckboxProps {
  alt?: boolean;
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}

export default function KingkillerCheckbox({ alt = false, id, label, checked, onChange, disabled = false, className = '' }: KingkillerCheckboxProps) {
  const color = alt ? 'text-kingkiller-white' : 'text-kingkiller-black';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="cursor-pointer disabled:opacity-disabled disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className={`text-sm ${color} cursor-pointer`}>{label}</label>
    </div>
  );
}
