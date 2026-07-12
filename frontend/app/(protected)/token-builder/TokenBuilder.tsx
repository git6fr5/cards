'use client';

import { useEffect, useState } from 'react';
import { get } from '@/utils/api';
import { resolveTokenDefinition } from './registry';
import type { TokenDefinition } from './registry';
import type { TokenData } from './types';
import type { BodyColor } from '@/utils/archetypes';
import PieceToken from '@/app/_components/Piece';
import TokenDisplay from './_components/TokenDisplay';
import RajaLoader from '@/components/layout/RajaLoader';

interface TokensResponse {
  tokens: TokenDefinition[];
}

export default function TokenBuilder() {
  const [tokens, setTokens]               = useState<TokenData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [bodyColor, setBodyColor]         = useState<BodyColor>('steel');
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    async function loadTokens() {
      setError(null);
      setIsLoading(true);
      try {
        const data = await get<TokensResponse>('/games/tokens/preview');
        setTokens(data.tokens.map(resolveTokenDefinition));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load tokens');
      } finally {
        setIsLoading(false);
      }
    }
    loadTokens();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raja-black">
        <RajaLoader alt size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raja-black">
        <p className="font-garamond text-sm text-raja-crimson">{error}</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raja-black">
        <p className="font-garamond text-sm text-raja-grey-muted">No tokens found.</p>
      </div>
    );
  }

  const token = tokens[selectedIndex];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-raja-black py-12">
      <button
        onClick={() => setBodyColor(bodyColor === 'steel' ? 'gold' : 'steel')}
        className="rounded-full border border-raja-stone px-4 py-1 text-xs uppercase tracking-widest text-raja-grey-muted hover:text-raja-white"
      >
        {bodyColor}
      </button>

      <div className="flex gap-6">
        {tokens.map((t, i) => {
          const isActive = i === selectedIndex;
          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex flex-col items-center gap-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <PieceToken
                name={t.name}
                archetype={t.archetype}
                pieceType={t.piece_type}
                bodyColor={bodyColor}
                size="md"
                abilityText={t.ability}
              />
              <span className="text-xs text-raja-grey-muted">{t.name}</span>
            </button>
          );
        })}
      </div>

      <TokenDisplay token={token} bodyColor={bodyColor} />
    </div>
  );
}
