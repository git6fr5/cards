'use client';

import { useEffect, useState } from 'react';
import { get, post } from '@/utils/api';
import RajaLoader from '@/components/layout/RajaLoader';
import Board from '@/app/_components/Board';
import PlayerPanel from './_components/PlayerPanel';
import TurnStatus from './_components/TurnStatus';
import ActionInput from './_components/ActionInput';
import GameLogPanel from './_components/GameLogPanel';
import InviteLink from './_components/InviteLink';
import type { GameState, ActionResult, PreviewActionResult } from '../types';

interface PlayRoomProps {
  room: string;
  player: number;
}

function parseSquareList(outcome: string): string[] {
  if (outcome === 'No legal moves') return [];
  return outcome.split(',').map((square) => square.trim());
}

export default function PlayRoom({ room, player }: PlayRoomProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [infoText, setInfoText] = useState<string | null>(null);

  useEffect(() => {
    async function loadState() {
      setError(null);
      setIsLoading(true);
      try {
        const state = await get<GameState>(`/games/${room}/state`);
        setGameState(state);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    loadState();
  }, [room]);

  async function previewAction(rawInput: string): Promise<PreviewActionResult | null> {
    try {
      return await post<PreviewActionResult>(`/actions/${room}/preview`, { raw_input: rawInput });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }

  async function handleSubmitAction(rawInput: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await post<ActionResult>(`/actions/${room}`, { raw_input: rawInput });
      setGameState(result.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectSquare(square: string) {
    setError(null);
    setHighlightedSquares([]);
    setInfoText(null);
    const [showResult, readResult] = await Promise.all([
      previewAction(`${square}!`),
      previewAction(`${square}#`),
    ]);
    if (showResult?.valid) {
      setHighlightedSquares(parseSquareList(showResult.outcome));
    }
    if (readResult) {
      setInfoText(readResult.outcome);
    }
  }

  async function handleSelectShelf(shelfIndex: number) {
    setError(null);
    setHighlightedSquares([]);
    const readResult = await previewAction(`S${shelfIndex}#`);
    setInfoText(readResult?.outcome ?? null);
  }

  function handleDropOnBoard(source: string, target: string) {
    setHighlightedSquares([]);
    setInfoText(null);
    handleSubmitAction(`${source}@${target}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-raja-black flex items-center justify-center">
        <RajaLoader alt size="lg" />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-raja-black flex items-center justify-center">
        <p className="font-sans-serif text-sm text-raja-crimson">{error ?? 'Game not found'}</p>
      </div>
    );
  }

  const self = gameState.players.find((p) => p.player_id === player) ?? gameState.players[0];
  const opponent = gameState.players.find((p) => p.player_id !== player) ?? gameState.players[1];
  const isActivePlayer = gameState.active_player_index === player;
  const lastOutcome = gameState.log[gameState.log.length - 1];

  return (
    <div className="min-h-screen bg-raja-black flex items-center justify-center gap-8 p-8">
      <div className="flex items-center gap-8">
        <PlayerPanel
          player={opponent}
          label={`Player ${opponent.player_id} — hand`}
          isOwn={false}
          isActivePlayer={isActivePlayer}
          onSelectShelf={handleSelectShelf}
        />

        <div className="flex flex-col items-center gap-4">
          <Board
            board={gameState.board}
            selfPlayerId={player}
            isActivePlayer={isActivePlayer}
            highlightedSquares={highlightedSquares}
            onSelectSquare={handleSelectSquare}
            onDrop={handleDropOnBoard}
          />
          <TurnStatus
            turnCount={gameState.turn_count}
            activePlayerIndex={gameState.active_player_index}
            lastOutcome={lastOutcome}
          />
          {infoText && (
            <p className="font-sans-serif text-xs text-raja-grey-light max-w-xs text-center">{infoText}</p>
          )}
          {error && (
            <p className="font-sans-serif text-xs text-raja-crimson">{error}</p>
          )}
          {isActivePlayer && (
            <ActionInput onSubmit={handleSubmitAction} isSubmitting={isSubmitting} />
          )}
          <InviteLink room={room} otherPlayerIndex={1 - player} />
        </div>

        <PlayerPanel
          player={self}
          label={`Player ${self.player_id} — hand`}
          isOwn
          isActivePlayer={isActivePlayer}
          onSelectShelf={handleSelectShelf}
        />
      </div>

      <GameLogPanel log={gameState.log} />
    </div>
  );
}
