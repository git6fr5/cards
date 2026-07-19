'use client';
import { useEffect, useState } from 'react';

interface MovementDiagramProps {
  pattern: 'square' | 'forward' | 'cross' | 'diagonal';
  label: string;
}

const BOARD_SIZE = 7;
const CENTER = 3;
const TICK_MS = 1000;
const MAX_DISTANCE = 3;

function isCross(dr: number, dc: number, distance: number): boolean {
  return (dr === 0 && Math.abs(dc) <= distance) || (dc === 0 && Math.abs(dr) <= distance);
}

function isDiagonal(dr: number, dc: number, distance: number): boolean {
  return Math.abs(dr) === Math.abs(dc) && Math.abs(dr) <= distance;
}

function isHighlighted(pattern: MovementDiagramProps['pattern'], dr: number, dc: number, distance: number): boolean {
  if (dr === 0 && dc === 0) return false;
  if (pattern === 'square') return isCross(dr, dc, distance) || isDiagonal(dr, dc, distance);
  if (pattern === 'forward') return dc === 0 && dr < 0 && dr >= -distance;
  if (pattern === 'cross') return isCross(dr, dc, distance);
  return isDiagonal(dr, dc, distance);
}

export default function MovementDiagram({ pattern, label }: MovementDiagramProps) {
  const [distance, setDistance] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDistance((d) => (d >= MAX_DISTANCE ? 1 : d + 1));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const cellCount = BOARD_SIZE * BOARD_SIZE;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: cellCount }, (_, i) => {
          const row = Math.floor(i / BOARD_SIZE);
          const col = i % BOARD_SIZE;
          const dr = row - CENTER;
          const dc = col - CENTER;
          const isCenter = dr === 0 && dc === 0;
          const isDot = !isCenter && isHighlighted(pattern, dr, dc, distance);
          return (
            <div key={i} className="flex h-5 w-5 items-center justify-center border border-raja-chrome-border">
              {isCenter && <span className="font-monospace text-xs text-raja-gold">P</span>}
              {isDot && <span className="text-xs text-raja-chrome-action">●</span>}
            </div>
          );
        })}
      </div>
      <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{label} {distance}</span>
    </div>
  );
}
