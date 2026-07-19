import RajaTableContainer from '@/components/table/RajaTableContainer';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import RajaBadge from '@/components/ui/RajaBadge';
import type { GameInviteEntry } from '../types';

interface OutgoingInvitesProps {
  entries: GameInviteEntry[];
}

export default function OutgoingInvites({ entries }: OutgoingInvitesProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Invites Pending</h2>
      <RajaTableContainer className="max-h-96">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-1/2" />
            <col className="w-1/4" />
            <col className="w-1/4" />
          </colgroup>
          <thead className="sticky top-0 z-dropdown bg-raja-chrome-bg">
            <tr className="border-b border-raja-chrome-border text-left">
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Invitee</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Status</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Sent</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-raja-chrome-border">
                <td className="px-3 py-2 font-serif text-sm text-raja-chrome-text truncate">
                  {entry.invitee_display_name ?? 'Unknown player'}
                </td>
                <td className="px-3 py-2"><RajaBadge text="Pending" tone="neutral" /></td>
                <td className="px-3 py-2 font-monospace text-xs text-raja-chrome-muted">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <RajaTableMessage text="No outgoing invites." muted />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </RajaTableContainer>
    </section>
  );
}
