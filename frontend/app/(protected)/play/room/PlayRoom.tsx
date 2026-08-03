'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { get, post } from '@/utils/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToastQueue } from '@/hooks/useToastQueue';
import RajaLoader from '@/components/layout/RajaLoader';
import MainPanel from './_components/MainPanel';
import Sidebar from './_components/Sidebar';
import GameLobby from './_components/GameLobby';
import Piece_OnDrag from '@/app/_components/Piece/Piece_OnDrag';
import type { GameState, ActionResult, PreviewActionResult, Game } from '../types';
import type { PieceFull } from '@/app/_components/types';

const DRAG_ACTIVATION_DISTANCE = 8;
const SHELF_DRAG_ID_PATTERN = /^shelf-\d+-(\d+)$/;

interface PlayRoomProps {
  room: string;
  initialSeatIndex: number;
  coop: boolean;
}

interface GameStateUpdateMessage {
  event: string;
  state: GameState;
}

function parseSquareList(outcome: string): string[] {
  if (outcome === 'No legal moves') return [];
  return outcome.split(',').map((square) => square.trim());
}

export default function PlayRoom({ room, initialSeatIndex, coop }: PlayRoomProps) {
  const [activeSeat, setActiveSeat] = useState(initialSeatIndex);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobbyGame, setLobbyGame] = useState<Game | null>(null);
  const [catalog, setCatalog] = useState<PieceFull[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [selectedPieceName, setSelectedPieceName] = useState<string | null>(null);
  const [activeDragPiece, setActiveDragPiece] = useState<PieceFull | null>(null);
  const { active: toast, push: pushToast, dismiss: dismissToast } = useToastQueue();
  const catalogByName = useMemo(() => new Map(catalog.map((piece) => [piece.name, piece])), [catalog]);
  const dragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }));

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
          get<GameState>(`/games/${room}/state?seat_index=${activeSeat}`),
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
  }, [room, activeSeat]);

  const handleSocketMessage = useCallback((message: GameStateUpdateMessage) => {
    if (message.event === 'STATE_UPDATE') {
      setGameState(message.state);
    }
  }, []);

  const wsParams = useMemo(() => ({ seat_index: String(activeSeat) }), [activeSeat]);
  useWebSocket<GameStateUpdateMessage>('games', room, handleSocketMessage, !!gameState, wsParams);

  async function previewAction(rawInput: string): Promise<PreviewActionResult | null> {
    try {
      return await post<PreviewActionResult>(`/actions/${room}/preview?seat_index=${activeSeat}`, { raw_input: rawInput });
    } catch (err) {
      pushToast({ text: err instanceof Error ? err.message : 'An error occurred', tone: 'error' });
      return null;
    }
  }

  async function handleSubmitAction(rawInput: string): Promise<boolean> {
    setIsSubmitting(true);
    try {
      const result = await post<ActionResult>(`/actions/${room}?seat_index=${activeSeat}`, { raw_input: rawInput });
      setGameState(result.state);
      return true;
    } catch (err) {
      pushToast({ text: err instanceof Error ? err.message : 'An error occurred', tone: 'error' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectSquare(square: string) {
    setHighlightedSquares([]);
    setSelectedSquare(square);
    const [showResult, readResult] = await Promise.all([
      previewAction(`${square}!`),
      previewAction(`${square}#`),
    ]);
    if (showResult?.valid) {
      setHighlightedSquares(parseSquareList(showResult.outcome));
    }
    if (readResult) {
      pushToast({ text: readResult.outcome, tone: 'success' });
    }
  }

  async function handleSelectShelf(shelfIndex: number) {
    setHighlightedSquares([]);
    setSelectedSquare(null);
    const readResult = await previewAction(`S${shelfIndex}#`);
    if (readResult) {
      pushToast({ text: readResult.outcome, tone: 'success' });
    }
  }

  function handleSelectPiece(name: string) {
    setSelectedPieceName(name);
  }

  function submitDrag(source: string, target: string) {
    setHighlightedSquares([]);
    setSelectedSquare(null);
    handleSubmitAction(`${source}@${target}`);
  }

  function handleDragStart(event: DragStartEvent) {
    const piece = event.active.data.current?.piece as PieceFull | undefined;
    setActiveDragPiece(piece ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragPiece(null);
    if (!event.over) return;
    const activeId = String(event.active.id);
    const target = String(event.over.id);
    const shelfMatch = activeId.match(SHELF_DRAG_ID_PATTERN);
    const source = shelfMatch ? `S${shelfMatch[1]}` : activeId;
    submitDrag(source, target);
  }

  async function handleEndTurn() {
    const succeeded = await handleSubmitAction('EOT');
    if (succeeded && coop) {
      setActiveSeat((seat) => 1 - seat);
    }
  }

  if (isLoading && !gameState) {
    return (
      <div className="min-h-screen bg-raja-chrome-bg flex items-center justify-center">
        <RajaLoader size="lg" />
      </div>
    );
  }

  if (lobbyGame) {
    return <GameLobby room={room} seatIndex={activeSeat} game={lobbyGame} />;
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-raja-chrome-bg flex items-center justify-center">
        <p className="font-sans-serif text-sm text-raja-chrome-error">{error ?? 'Game not found'}</p>
      </div>
    );
  }

  const self = gameState.players.find((p) => p.seat_index === activeSeat) ?? gameState.players[0];
  const opponent = gameState.players.find((p) => p.seat_index !== activeSeat) ?? gameState.players[1];
  const isActivePlayer = gameState.active_player_index === activeSeat;
  const lastOutcome = gameState.log[gameState.log.length - 1];
  const selectedPiece = selectedPieceName
    ? catalog.find((piece) => piece.name === selectedPieceName) ?? null
    : null;

  return (
    <DndContext sensors={dragSensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-raja-chrome-bg flex items-center justify-center p-8">
        <div className="flex w-full h-[85vh] bg-raja-chrome-panel border border-raja-chrome-border">
          <div className="flex-4 h-full">
            <MainPanel
              board={gameState.board}
              catalogByName={catalogByName}
              selfPlayer={self}
              opponentPlayer={opponent}
              selfLabel={`Player ${self.seat_index} — hand`}
              opponentLabel={`Player ${opponent.seat_index} — hand`}
              selfPlayerId={activeSeat}
              otherPlayerIndex={1 - activeSeat}
              isActivePlayer={isActivePlayer}
              isSubmitting={isSubmitting}
              flipped={activeSeat === 1}
              highlightedSquares={highlightedSquares}
              selectedSquare={selectedSquare}
              toast={toast}
              turnCount={gameState.turn_count}
              activePlayerIndex={gameState.active_player_index}
              lastOutcome={lastOutcome}
              room={room}
              onSelectSquare={handleSelectSquare}
              onSelectPiece={handleSelectPiece}
              onSelectShelf={handleSelectShelf}
              onEndTurn={handleEndTurn}
              onDismissToast={dismissToast}
            />
          </div>
          <div className="flex-1 h-full border-l border-raja-chrome-border">
            <Sidebar piece={selectedPiece} log={gameState.log} />
          </div>
        </div>
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeDragPiece && <Piece_OnDrag piece={activeDragPiece} />}
      </DragOverlay>
    </DndContext>
  );
}
