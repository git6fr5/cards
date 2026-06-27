'use client';

import { useRef, useState, useEffect } from 'react';
import { get, post } from '@/utils/api';
import KingkillerButton from '@/components/forms/KingkillerButton';
import KingkillerLoader from '@/components/layout/KingkillerLoader';
import GameBoard from './_components/GameBoard';
import PlayerShelf from './_components/PlayerShelf';
import type { GameState, SetResponse } from './types';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';

type Phase = 'idle' | 'loading' | 'playing';

interface PlayPageProps {
  roomId: number;
  playerId: number;
}

export default function PlayPage({ roomId, playerId }: PlayPageProps) {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const wsRef                     = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  async function handleStartGame() {
    setError(null);
    setPhase('loading');
    try {
      const [p0, p1] = await Promise.all([
        get<SetResponse>('/sets/default/dragon'),
        get<SetResponse>('/sets/default/goblin'),
      ]);

      const initialState = await post<GameState>(`/game/room/${roomId}/start`, {
        player_0_tokens: p0.tokens.map((t) => t.name),
        player_1_tokens: p1.tokens.map((t) => t.name),
      });

      setGameState(initialState);

      const ws = new WebSocket(`${WS_BASE}/game/ws/${roomId}`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string);
        if (msg.event === 'STATE_UPDATE') {
          setGameState(msg.state as GameState);
        }
      };

      setPhase('playing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('idle');
    }
  }

  const opponent = gameState?.players[playerId === 0 ? '1' : '0'];
  const self     = gameState?.players[String(playerId)];

  return (
    <div className="min-h-screen bg-kingkiller-black flex flex-col items-center justify-center gap-8 py-10">
      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-6">
          <h1 className="font-garamond text-3xl text-kingkiller-white tracking-wide">
            Room {roomId}
          </h1>
          {error && (
            <p className="font-garamond text-sm text-kingkiller-crimson">{error}</p>
          )}
          <KingkillerButton
            alt
            variant="action"
            text="Start Game"
            onClick={handleStartGame}
          />
        </div>
      )}

      {phase === 'loading' && (
        <KingkillerLoader alt size="lg" />
      )}

      {phase === 'playing' && gameState && (
        <>
          {opponent && (
            <PlayerShelf
              shelf={opponent.shelf}
              label={`Player ${opponent.player_id} — hand`}
            />
          )}

          <GameBoard gameState={gameState} />

          {self && (
            <PlayerShelf
              shelf={self.shelf}
              label={`Player ${self.player_id} — hand`}
            />
          )}

          <div className="flex flex-col items-center gap-1">
            <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">
              Turn {gameState.turn} — Player {gameState.active_player}&apos;s move
            </span>
            {gameState.log.length > 0 && (
              <p className="font-garamond text-xs text-kingkiller-grey-muted">
                {gameState.log[gameState.log.length - 1]}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
