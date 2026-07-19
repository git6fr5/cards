'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/utils/api';
import RajaButton from '@/components/ui/RajaButton';
import RajaSection from '@/components/layout/RajaSection';
import type { Game } from './types';

export default function PlayLanding() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleStartGame() {
    setError(null);
    setIsLoading(true);
    try {
      const game = await post<Game>('/games/');
      router.push(`/play/room?room=${game.room}&player=0`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <RajaSection alt className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="font-serif text-3xl text-raja-chrome-bg tracking-wide">
        Raja
      </h1>
      {error && (
        <p className="font-sans-serif text-sm text-raja-chrome-error">{error}</p>
      )}
      <RajaButton
        variant="action"
        text="Start Game"
        loading={isLoading}
        onClick={handleStartGame}
      />
    </RajaSection>
  );
}
