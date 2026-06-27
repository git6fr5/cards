import type { Piece } from '../types';

const ARCHETYPE_COLOR: Record<string, string> = {
  DRAGON: 'var(--color-kingkiller-crimson)',
  GOBLIN: 'var(--color-kingkiller-emerald)',
};

const BODY_CLASSES: Record<string, string> = {
  white: 'bg-kingkiller-white text-kingkiller-black',
  black: 'bg-kingkiller-black text-kingkiller-white',
};

interface PieceTokenProps {
  piece: Piece;
}

export default function PieceToken({ piece }: PieceTokenProps) {
  const borderColor = ARCHETYPE_COLOR[piece.archetype] ?? 'var(--color-kingkiller-stone)';
  const bodyClass   = BODY_CLASSES[piece.body_color] ?? BODY_CLASSES.white;
  const ownerRing   = piece.owner_id === 1 ? 'ring-1 ring-kingkiller-gold' : '';

  return (
    <div
      title={piece.name}
      className={`flex items-center justify-center rounded-full w-10 h-10 border-2 font-garamond text-sm font-semibold select-none ${bodyClass} ${ownerRing}`}
      style={{ borderColor }}
    >
      {piece.name.charAt(0).toUpperCase()}
    </div>
  );
}
