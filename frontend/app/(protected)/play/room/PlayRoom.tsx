'use client';

import { useEffect, useState } from 'react';
import { get, post } from '@/utils/api';
import RajaLoader from '@/components/layout/RajaLoader';
import MainPanel from './_components/MainPanel';
import Sidebar from './_components/Sidebar';
import GameLobby from './_components/GameLobby';
import type { GameState, ActionResult, PreviewActionResult, Game } from '../types';
import type { PieceFull } from '@/app/_components/types';

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
  const [lobbyGame, setLobbyGame] = useState<Game | null>(null);
  const [catalog, setCatalog] = useState<PieceFull[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [infoText, setInfoText] = useState<string | null>(null);
  const [selectedPieceName, setSelectedPieceName] = useState<string | null>(null);

  useEffect(() => {
    async function loadState() {
      setError(null);
      setIsLoading(true);
      try {
        const game = await get<Game>(`/games/${room}`);
        const isFull = game.players.every((seat) => seat.player_id !== null);
        if (!isFull) {
          setLobbyGame(game);
          return;
        }
        const [state, pieces] = await Promise.all([
          get<GameState>(`/games/${room}/state`),
          get<PieceFull[]>('/pieces/full'),
        ]);
        setGameState(state);
        setCatalog(pieces);
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

  function handleSelectPiece(name: string) {
    setSelectedPieceName(name);
  }

  function handleDropOnBoard(source: string, target: string) {
    setHighlightedSquares([]);
    setInfoText(null);
    handleSubmitAction(`${source}@${target}`);
  }

  function handleEndTurn() {
    handleSubmitAction('EOT');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-raja-chrome-bg flex items-center justify-center">
        <RajaLoader size="lg" />
      </div>
    );
  }

  if (lobbyGame) {
    return <GameLobby room={room} player={player} game={lobbyGame} />;
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-raja-chrome-bg flex items-center justify-center">
        <p className="font-sans-serif text-sm text-raja-chrome-error">{error ?? 'Game not found'}</p>
      </div>
    );
  }

  const self = gameState.players.find((p) => p.player_id === player) ?? gameState.players[0];
  const opponent = gameState.players.find((p) => p.player_id !== player) ?? gameState.players[1];
  const isActivePlayer = gameState.active_player_index === player;
  const lastOutcome = gameState.log[gameState.log.length - 1];
  const selectedPiece = selectedPieceName
    ? catalog.find((piece) => piece.name === selectedPieceName) ?? null
    : null;

  return (
    <div className="min-h-screen bg-raja-chrome-bg flex items-center justify-center p-8">
      <div className="flex w-full h-[85vh] bg-raja-chrome-panel border border-raja-chrome-border">
        <div className="flex-4 h-full">
          <MainPanel
            board={gameState.board}
            selfPlayer={self}
            opponentPlayer={opponent}
            selfLabel={`Player ${self.player_id} — hand`}
            opponentLabel={`Player ${opponent.player_id} — hand`}
            selfPlayerId={player}
            otherPlayerIndex={1 - player}
            isActivePlayer={isActivePlayer}
            isSubmitting={isSubmitting}
            flipped={player === 1}
            highlightedSquares={highlightedSquares}
            infoText={infoText}
            error={error}
            turnCount={gameState.turn_count}
            activePlayerIndex={gameState.active_player_index}
            lastOutcome={lastOutcome}
            room={room}
            onSelectSquare={handleSelectSquare}
            onSelectPiece={handleSelectPiece}
            onDrop={handleDropOnBoard}
            onSelectShelf={handleSelectShelf}
            onEndTurn={handleEndTurn}
          />
        </div>
        <div className="flex-1 h-full border-l border-raja-chrome-border">
          <Sidebar piece={selectedPiece} log={gameState.log} />
        </div>
      </div>
    </div>
  );
}
