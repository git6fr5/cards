'use client';

import { useRouter } from 'next/navigation';
import RajaTableContainer from '@/components/table/RajaTableContainer';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import RajaButton from '@/components/ui/RajaButton';
import type { ActiveGameEntry } from '../types';

interface ActiveGamesProps {
  entries: ActiveGameEntry[];
}

export default function ActiveGames({ entries }: ActiveGamesProps) {
  const router = useRouter();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Active Games</h2>
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
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Started</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.room} className="border-b border-raja-chrome-border">
                <td className="px-3 py-2 font-serif text-sm text-raja-chrome-text truncate">
                  {entry.opponent_display_name ?? 'Unknown player'}
                </td>
                <td className="px-3 py-2 font-monospace text-xs text-raja-chrome-muted">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <RajaButton
                    variant="action"
                    text="Resume"
                    onClick={() => router.push(`/play/room?room=${entry.room}&player=${entry.player_index}`)}
                  />
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <RajaTableMessage text="No active games." muted />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </RajaTableContainer>
    </section>
  );
}
