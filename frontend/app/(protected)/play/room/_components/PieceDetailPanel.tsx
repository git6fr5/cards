import Piece_Card from '@/app/_components/Piece/Piece_Card';
import type { PieceFull } from '@/app/_components/types';

interface PieceDetailPanelProps {
  piece: PieceFull | null;
}

export default function PieceDetailPanel({ piece }: PieceDetailPanelProps) {
  if (!piece) {
    return (
      <p className="font-sans-serif text-xs text-raja-chrome-muted text-center">
        Select a piece to view details
      </p>
    );
  }
  return <Piece_Card piece={piece} />;
}
