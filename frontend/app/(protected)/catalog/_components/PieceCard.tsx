'use client';

import { useDraggable } from '@dnd-kit/core';
import PieceToken from '@/app/_components/Piece';
import MovementBoard from '@/app/_components/MovementBoard';
import type { MovementPattern } from '@/app/_components/MovementBoard';
import { ARCHETYPES, PIECE_TYPES } from '@/utils/archetypes';
import RajaCostCircle from '@/components/ui/RajaCostCircle';
import RajaArchetypePill from '@/components/ui/RajaArchetypePill';
import type { PieceFull } from '../types';

interface PieceCardProps {
  piece: PieceFull;
}

export default function PieceCard({ piece }: PieceCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${piece.name}`,
    data: { piece, source: 'catalog' },
  });

  const opacity = isDragging ? 'opacity-40' : '';
  const pattern = piece.movement_type.toLowerCase() as MovementPattern;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-2 border border-raja-chrome-border bg-raja-chrome-panel p-3 cursor-grab ${opacity}`}
    >
      <p className="font-serif text-sm text-raja-chrome-text text-center">{piece.name}</p>
      <PieceToken
        name={piece.name}
        archetype={ARCHETYPES[piece.archetype]}
        pieceType={PIECE_TYPES[piece.role_type]}
        bodyColor="steel"
        size="md"
      />
      <RajaArchetypePill archetype={piece.archetype} />
      <MovementBoard pattern={pattern} distance={piece.movement_distance} size="sm" />
      <p className="font-monospace text-[0.55rem] text-raja-chrome-text whitespace-pre-line text-center">
        {piece.ability}
      </p>
      <div className="flex w-full items-center justify-between">
        <RajaCostCircle value={piece.attributes.summon_cost} label="Summon cost" bgClassName="bg-raja-ink/50" />
        <RajaCostCircle value={piece.attributes.action_cost} label="Action cost" />
      </div>
    </div>
  );
}
