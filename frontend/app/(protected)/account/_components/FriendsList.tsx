import RajaTableContainer from '@/components/table/RajaTableContainer';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import type { FriendEntry } from '../types';
import { friendCounterpartName } from '../types';

interface FriendsListProps {
  friends: FriendEntry[];
  currentPlayerId: number;
}

export default function FriendsList({ friends, currentPlayerId }: FriendsListProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Friends</h2>
      <RajaTableContainer className="max-h-64">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-2/3" />
            <col className="w-1/3" />
          </colgroup>
          <thead className="sticky top-0 z-dropdown bg-raja-chrome-bg">
            <tr className="border-b border-raja-chrome-border text-left">
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Name</th>
              <th className="px-3 py-2 font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">Friends Since</th>
            </tr>
          </thead>
          <tbody>
            {friends.map((friend) => (
              <tr key={friend.id} className="border-b border-raja-chrome-border">
                <td className="px-3 py-2 font-serif text-sm text-raja-chrome-text truncate">
                  {friendCounterpartName(friend, currentPlayerId)}
                </td>
                <td className="px-3 py-2 font-monospace text-xs text-raja-chrome-muted">
                  {friend.responded_at ? new Date(friend.responded_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {friends.length === 0 && (
              <tr>
                <td colSpan={2}>
                  <RajaTableMessage text="No friends yet." muted />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </RajaTableContainer>
    </section>
  );
}
