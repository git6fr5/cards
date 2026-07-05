'use client';

import { useState } from 'react';
import KingkillerTextField from '@/components/forms/KingkillerTextField';
import KingkillerButton from '@/components/forms/KingkillerButton';

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
      <KingkillerTextField
        id="raw-input"
        label="Move (raw input)"
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="e.g. A1@B2"
        disabled={isSubmitting}
      />
      <KingkillerButton
        variant="action"
        text="Submit"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!rawInput.trim()}
      />
    </div>
  );
}
