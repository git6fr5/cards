'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { get } from '@/utils/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import RajaLoader from './RajaLoader';

interface RajaRequirePlayerProps {
  children: ReactNode;
}

interface PlayerResponse {
  id: number;
}

export default function RajaRequirePlayer({ children }: RajaRequirePlayerProps) {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [hasPlayer, setHasPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }

    async function checkPlayer() {
      try {
        await get<PlayerResponse>('/players/me');
        setHasPlayer(true);
      } catch (err) {
        const notFound = err instanceof Error && err.message.includes('404');
        if (notFound) {
          router.replace('/account');
          return;
        }
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
    checkPlayer();
  }, [isUserLoading, user, router]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-raja-chrome-bg">
        <p className="font-sans-serif text-sm text-raja-chrome-error">{error}</p>
      </div>
    );
  }

  if (!hasPlayer) {
    return (
      <div className="flex h-screen items-center justify-center bg-raja-chrome-bg">
        <RajaLoader size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
