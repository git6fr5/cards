export type MovementPattern = 'square' | 'forward' | 'cross' | 'diagonal' | 'none';

interface MovementBoardProps {
  pattern: MovementPattern;
  distance: number;
  size?: 'sm' | 'md';
}

const BOARD_SIZE = 7;
const CENTER = 3;

const CELL_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
};

const DOT_TEXT_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'text-[0.5rem]',
  md: 'text-xs',
};

function isCross(dr: number, dc: number, distance: number): boolean {
  return (dr === 0 && Math.abs(dc) <= distance) || (dc === 0 && Math.abs(dr) <= distance);
}

function isDiagonal(dr: number, dc: number, distance: number): boolean {
  return Math.abs(dr) === Math.abs(dc) && Math.abs(dr) <= distance;
}

export function isMovementHighlighted(pattern: MovementPattern, dr: number, dc: number, distance: number): boolean {
  if (dr === 0 && dc === 0) return false;
  if (pattern === 'none') return false;
  if (pattern === 'square') return isCross(dr, dc, distance) || isDiagonal(dr, dc, distance);
  if (pattern === 'forward') return dc === 0 && dr < 0 && dr >= -distance;
  if (pattern === 'cross') return isCross(dr, dc, distance);
  return isDiagonal(dr, dc, distance);
}

export default function MovementBoard({ pattern, distance, size = 'md' }: MovementBoardProps) {
  const cellCount = BOARD_SIZE * BOARD_SIZE;
  const cellClass = CELL_CLASSES[size];
  const dotTextClass = DOT_TEXT_CLASSES[size];

  return (
    <div className="grid grid-cols-7 gap-0.5">
      {Array.from({ length: cellCount }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const dr = row - CENTER;
        const dc = col - CENTER;
        const isCenter = dr === 0 && dc === 0;
        const isDot = !isCenter && isMovementHighlighted(pattern, dr, dc, distance);
        return (
          <div key={i} className={`flex items-center justify-center border border-raja-chrome-border ${cellClass}`}>
            {isCenter && <span className={`font-monospace text-raja-gold ${dotTextClass}`}>P</span>}
            {isDot && <span className={`text-raja-chrome-action ${dotTextClass}`}>●</span>}
          </div>
        );
      })}
    </div>
  );
}
