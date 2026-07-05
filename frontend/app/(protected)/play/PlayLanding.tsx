'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/utils/api';
import KingkillerButton from '@/components/forms/KingkillerButton';
import KingkillerSection from '@/components/layout/KingkillerSection';
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
    <KingkillerSection alt className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="font-garamond text-3xl text-kingkiller-white tracking-wide">
        Kingkiller
      </h1>
      {error && (
        <p className="font-garamond text-sm text-kingkiller-crimson">{error}</p>
      )}
      <KingkillerButton
        alt
        variant="action"
        text="Start Game"
        loading={isLoading}
        onClick={handleStartGame}
      />
    </KingkillerSection>
  );
}
