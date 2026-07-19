'use client';

import { useState } from 'react';
import RajaTextField from '@/components/ui/RajaTextField';
import RajaButton from '@/components/ui/RajaButton';

interface ActionInputProps {
  onSubmit: (rawInput: string) => void;
  isSubmitting: boolean;
}

export default function ActionInput({ onSubmit, isSubmitting }: ActionInputProps) {
  const [rawInput, setRawInput] = useState('');

  function handleSubmit() {
    if (!rawInput.trim()) return;
    onSubmit(rawInput);
    setRawInput('');
  }

  return (
    <div className="flex items-end gap-2">
      <RajaTextField
        id="raw-input"
        label="Move (raw input)"
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="e.g. A1@B2"
        disabled={isSubmitting}
      />
      <RajaButton
        variant="action"
        text="Submit"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!rawInput.trim()}
      />
    </div>
  );
}
