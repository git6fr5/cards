'use client';
import { useEffect, useState } from 'react';
import MovementBoard from '@/app/_components/MovementBoard';
import type { MovementPattern } from '@/app/_components/MovementBoard';

interface MovementDiagramProps {
  pattern: MovementPattern;
  label: string;
}

const TICK_MS = 1000;
const MAX_DISTANCE = 3;

export default function MovementDiagram({ pattern, label }: MovementDiagramProps) {
  const [distance, setDistance] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDistance((d) => (d >= MAX_DISTANCE ? 1 : d + 1));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <MovementBoard pattern={pattern} distance={distance} />
      <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{label} {distance}</span>
    </div>
  );
}
