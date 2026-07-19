export type PieceRole = 'focus' | 'other' | 'king';
export type PieceOwner = 'gold' | 'silver';

export type BoardMark =
  | { row: number; col: number; type: 'piece'; role: PieceRole; owner: PieceOwner; emphasized?: boolean; pulse?: boolean; dimmed?: boolean }
  | { row: number; col: number; type: 'arrow'; direction: '→' | '↓' | '←' | '↑' }
  | { row: number; col: number; type: 'killed' };

export const BOTH_KINGS: BoardMark[] = [
  { row: 3, col: 0, type: 'piece', role: 'king', owner: 'gold' },
  { row: 3, col: 6, type: 'piece', role: 'king', owner: 'silver' },
];

interface BoardStateProps {
  marks: BoardMark[];
  caption: string;
}

const BOARD_SIZE = 7;

function cellGlyph(mark: BoardMark): { text: string; className: string } {
  if (mark.type === 'arrow') return { text: mark.direction, className: 'text-raja-chrome-action' };
  if (mark.type === 'killed') return { text: '✕', className: 'text-raja-chrome-muted' };
  const letter = mark.role === 'focus' ? 'P' : mark.role === 'king' ? 'K' : 'A';
  const ownerColor = mark.owner === 'gold' ? 'text-raja-gold' : 'text-raja-steel';
  const emphasis = mark.emphasized ? 'font-bold' : '';
  const dim = mark.dimmed ? 'opacity-disabled' : '';
  return { text: letter, className: `${ownerColor} ${emphasis} ${dim}`.trim() };
}

function isPulsing(mark: BoardMark): boolean {
  return mark.type === 'piece' && Boolean(mark.pulse);
}

export default function BoardState({ marks, caption }: BoardStateProps) {
  const cellCount = BOARD_SIZE * BOARD_SIZE;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: cellCount }, (_, i) => {
          const row = Math.floor(i / BOARD_SIZE);
          const col = i % BOARD_SIZE;
          const mark = marks.find((m) => m.row === row && m.col === col);
          const borderClass = mark && isPulsing(mark) ? 'border-2 border-raja-chrome-action' : 'border border-raja-chrome-border';
          const glyph = mark ? cellGlyph(mark) : null;
          return (
            <div key={i} className={`flex h-5 w-5 items-center justify-center ${borderClass}`}>
              {glyph && <span className={`font-monospace text-xs ${glyph.className}`}>{glyph.text}</span>}
            </div>
          );
        })}
      </div>
      <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{caption}</span>
    </div>
  );
}
