'use client';

import { useEffect, useMemo, useState } from 'react';
import { get } from '@/utils/api';
import RajaLoader from '@/components/layout/RajaLoader';
import RajaButton from '@/components/ui/RajaButton';
import RajaToast from '@/components/layout/RajaToast';
import { useEnsurePlayer } from '@/hooks/useEnsurePlayer';
import type { Bag, PieceFull } from '@/app/_components/types';
import type { GameHistoryEntry, FriendEntry, GameInviteEntry, ActiveGameEntry } from './types';
import GameHistoryTable from './_components/GameHistoryTable';
import FriendsList from './_components/FriendsList';
import StartGamePanel from './_components/StartGamePanel';
import IncomingInvites from './_components/IncomingInvites';
import ActiveGames from './_components/ActiveGames';
import OutgoingInvites from './_components/OutgoingInvites';
import AccountBags from './_components/AccountBags';

interface CurrentPlayer {
  id: number;
}

export default function Account() {
  const { isReady, error: playerError } = useEnsurePlayer();

  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [bags, setBags] = useState<Bag[]>([]);
  const [pieces, setPieces] = useState<PieceFull[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [activeGames, setActiveGames] = useState<ActiveGameEntry[]>([]);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<GameInviteEntry[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<GameInviteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isReady) return;

    async function loadData() {
      setError(null);
      setIsLoading(true);
      try {
        const [player, bagsData, piecesData, historyData, activeGamesData, friendsData, invitesData, sentInvitesData] = await Promise.all([
          get<CurrentPlayer>('/players/me'),
          get<Bag[]>('/bags'),
          get<PieceFull[]>('/pieces/full'),
          get<GameHistoryEntry[]>('/games/history'),
          get<ActiveGameEntry[]>('/games/active'),
          get<FriendEntry[]>('/friends'),
          get<GameInviteEntry[]>('/game_invites'),
          get<GameInviteEntry[]>('/game_invites/sent'),
        ]);
        setCurrentPlayerId(player.id);
        setBags(bagsData);
        setPieces(piecesData);
        setGameHistory(historyData);
        setActiveGames(activeGamesData);
        setFriends(friendsData);
        setIncomingInvites(invitesData);
        setOutgoingInvites(sentInvitesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isReady]);

  const catalogByName = useMemo(() => new Map(pieces.map((piece) => [piece.name, piece])), [pieces]);

  function handleStarted(message: string) {
    setToast({ text: message, tone: 'success' });
  }

  function handleError(message: string) {
    setToast({ text: message, tone: 'error' });
  }

  if (!isReady) {
    const setupColor = playerError ? 'text-raja-chrome-error' : 'text-raja-chrome-muted';
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-raja-chrome-bg">
        <RajaLoader size="lg" />
        <p className={`font-sans-serif text-sm ${setupColor}`}>
          {playerError ?? 'First time logging in — setting up.'}
        </p>
      </div>
    );
  }

  if (isLoading || currentPlayerId === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-raja-chrome-bg">
        <RajaLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raja-chrome-bg p-6">
      <div className="flex flex-col gap-8 max-w-page mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-raja-chrome-text tracking-wide">Account</h1>
          <RajaButton variant="link" href="/catalog" text="Bag Builder" alt />
        </div>

        {error && <p className="font-sans-serif text-sm text-raja-chrome-error">{error}</p>}

        <StartGamePanel
          bags={bags}
          friends={friends}
          currentPlayerId={currentPlayerId}
          onStarted={handleStarted}
          onError={handleError}
        />

        <IncomingInvites invites={incomingInvites} bags={bags} onError={handleError} />

        <ActiveGames entries={activeGames} />

        <OutgoingInvites entries={outgoingInvites} />

        <GameHistoryTable entries={gameHistory} />

        <FriendsList friends={friends} currentPlayerId={currentPlayerId} />

        <AccountBags bags={bags} catalogByName={catalogByName} isLoading={false} />
      </div>

      {toast && <RajaToast text={toast.text} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
