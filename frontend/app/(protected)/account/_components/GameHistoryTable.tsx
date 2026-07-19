import RajaTableContainer from '@/components/table/RajaTableContainer';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import RajaBadge from '@/components/ui/RajaBadge';
import type { GameHistoryEntry } from '../types';

interface GameHistoryTableProps {
  entries: GameHistoryEntry[];
}

export default function GameHistoryTable({ entries }: GameHistoryTableProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Game History</h2>
      <RajaTableContainer className="max-h-96">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-1/2" />
            <col className="w-1/4" />
            <col className="w-1/4" />
          </colgroup>
          <thead className="sticky top-0 z-dropdown bg-raja-chrome-bg">
            <tr className="border-b border-raja-chrome-border text-left">
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Opponent</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Result</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const tone = entry.result === 'loss' ? 'danger' : 'neutral';
              return (
                <tr key={entry.room} className="border-b border-raja-chrome-border">
                  <td className="px-3 py-2 font-serif text-sm text-raja-chrome-text truncate">
                    {entry.opponent_display_name ?? 'Unknown player'}
                  </td>
                  <td className="px-3 py-2"><RajaBadge text={entry.result === 'win' ? 'Win' : 'Loss'} tone={tone} /></td>
                  <td className="px-3 py-2 font-monospace text-xs text-raja-chrome-muted">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <RajaTableMessage text="No finished games yet." muted />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </RajaTableContainer>
    </section>
  );
}
