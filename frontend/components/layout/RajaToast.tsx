'use client';
import { useEffect } from 'react';

interface RajaToastProps {
  text: string;
  onDismiss: () => void;
  tone?: 'success' | 'error';
  durationMs?: number;
  className?: string;
}

const TONE_CLASSES: Record<'success' | 'error', string> = {
  success: 'bg-raja-chrome-action',
  error:   'bg-raja-chrome-error',
};

export default function RajaToast({ text, onDismiss, tone = 'error', durationMs = 3000, className = '' }: RajaToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [text, durationMs, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-toast px-4 py-2 text-raja-chrome-bg font-sans-serif text-sm shadow-lg ${TONE_CLASSES[tone]} ${className}`}
    >
      {text}
    </div>
  );
}
