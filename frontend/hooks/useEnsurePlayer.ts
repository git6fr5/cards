import { useEffect, useState } from 'react';
import { get, post } from '@/utils/api';

interface PlayerResponse {
  id: number;
  user_id: number;
}

export function useEnsurePlayer() {
  const [isReady, setIsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function ensurePlayer() {
      try {
        await get<PlayerResponse>('/players/me');
        setIsReady(true);
      } catch (err) {
        const notFound = err instanceof Error && err.message.includes('404');
        if (!notFound) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          return;
        }
        setIsCreating(true);
        try {
          await post<PlayerResponse>('/players');
          setIsReady(true);
        } catch (createErr) {
          setError(createErr instanceof Error ? createErr.message : 'An error occurred');
        } finally {
          setIsCreating(false);
        }
      }
    }
    ensurePlayer();
  }, []);

  return { isReady, isCreating, error };
}
