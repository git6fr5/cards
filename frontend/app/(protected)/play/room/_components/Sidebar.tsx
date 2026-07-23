import PieceDetailPanel from './PieceDetailPanel';
import GameLogPanel from './GameLogPanel';
import type { PieceFull } from '@/app/_components/types';

interface SidebarProps {
  piece: PieceFull | null;
  log: string[];
}

export default function Sidebar({ piece, log }: SidebarProps) {
  return (
    <div className="flex flex-col w-full h-full bg-raja-chrome-panel">
      <div className="flex-1 min-h-0 overflow-y-auto p-3 border-b border-raja-chrome-border flex items-center justify-center">
        <PieceDetailPanel piece={piece} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <GameLogPanel log={log} />
      </div>
    </div>
  );
}
