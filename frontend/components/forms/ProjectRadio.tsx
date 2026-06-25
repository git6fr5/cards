'use client';

interface RadioOption {
  value: string;
  label: string;
}

interface ProjectRadioProps {
  alt?: boolean;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ProjectRadio({ alt = false, name, options, value, onChange, disabled = false, className = '' }: ProjectRadioProps) {
  const color = alt ? 'text-project-white' : 'text-project-black';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {options.map(opt => (
        <div key={opt.value} className="flex items-center gap-2">
          <input
            type="radio"
            id={`${name}-${opt.value}`}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
            className="cursor-pointer disabled:opacity-disabled disabled:cursor-not-allowed"
          />
          <label htmlFor={`${name}-${opt.value}`} className={`text-sm ${color} cursor-pointer`}>
            {opt.label}
          </label>
        </div>
      ))}
    </div>
  );
}
