'use client';
import { useState } from 'react';
import type { ChangeEvent } from 'react';

interface ProjectFileUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function ProjectFileUpload({ label, onChange, accept, disabled = false, error, className = '' }: ProjectFileUploadProps) {
  const [filename, setFilename] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFilename(file?.name ?? '');
    onChange(file);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-project-black">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="text-sm text-project-grey disabled:opacity-disabled disabled:cursor-not-allowed"
      />
      {filename && <p className="text-xs text-project-grey">{filename}</p>}
      {error && <p className="text-xs text-project-red">{error}</p>}
    </div>
  );
}
