'use client';

import { useEffect, useState } from 'react';
import { get } from '@/utils/api';
import { resolveTokenDefinition } from './registry';
import type { TokenDefinition } from './registry';
import type { TokenData } from './types';
import TokenCircle from './_components/TokenCircle';
import TokenDisplay from './_components/TokenDisplay';
import KingkillerLoader from '@/components/layout/KingkillerLoader';

interface TokensResponse {
  tokens: TokenDefinition[];
}

export default function TokenBuilder() {
  const [tokens, setTokens]               = useState<TokenData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    async function loadTokens() {
      setError(null);
      setIsLoading(true);
      try {
        const data = await get<TokensResponse>('/sets/tokens');
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
      <div className="flex min-h-screen items-center justify-center bg-kingkiller-black">
        <KingkillerLoader alt size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kingkiller-black">
        <p className="font-garamond text-sm text-kingkiller-crimson">{error}</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kingkiller-black">
        <p className="font-garamond text-sm text-kingkiller-grey-muted">No tokens found.</p>
      </div>
    );
  }

  const token = tokens[selectedIndex];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-kingkiller-black py-12">
      <div className="flex gap-6">
        {tokens.map((t, i) => {
          const isActive = i === selectedIndex;
          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex flex-col items-center gap-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <TokenCircle archetype={t.archetype} pieceType={t.piece_type} bodyColor={t.bodyColor} size="md" />
              <span className="text-xs text-kingkiller-grey-muted">{t.name}</span>
            </button>
          );
        })}
      </div>

      <TokenDisplay token={token} />
    </div>
  );
}
