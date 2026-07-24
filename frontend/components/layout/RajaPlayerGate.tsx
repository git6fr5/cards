'use client';

import type { ReactNode } from 'react';
import { useEnsurePlayer } from '@/hooks/useEnsurePlayer';
import RajaLoader from './RajaLoader';

interface RajaPlayerGateProps {
  children: ReactNode;
}

export default function RajaPlayerGate({ children }: RajaPlayerGateProps) {
  const { isReady, isCreating, error } = useEnsurePlayer();

  if (!isReady) {
    const setupColor = error ? 'text-raja-chrome-error' : 'text-raja-chrome-muted';
    const setupText = error ?? (isCreating ? 'Setting up account' : null);
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-raja-chrome-bg">
        <RajaLoader size="lg" />
        {setupText && <p className={`font-sans-serif text-sm ${setupColor}`}>{setupText}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
