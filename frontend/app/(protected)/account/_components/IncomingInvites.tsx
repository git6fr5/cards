'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { put } from '@/utils/api';
import RajaDropdown from '@/components/ui/RajaDropdown';
import RajaButton from '@/components/ui/RajaButton';
import RajaTableMessage from '@/components/table/RajaTableMessage';
import type { Bag } from '@/app/_components/types';
import type { GameInviteEntry } from '../types';

interface IncomingInvitesProps {
  invites: GameInviteEntry[];
  bags: Bag[];
  onError: (message: string) => void;
}

interface ClaimedInvite {
  room: string;
}

export default function IncomingInvites({ invites, bags, onError }: IncomingInvitesProps) {
  const router = useRouter();
  const [selectedBagIdByInviteId, setSelectedBagIdByInviteId] = useState<Record<number, string>>({});
  const [claimingInviteId, setClaimingInviteId] = useState<number | null>(null);

  const bagOptions = bags.map((bag) => ({ value: String(bag.id), label: bag.name }));

  async function handleAccept(invite: GameInviteEntry) {
    const selectedBagId = selectedBagIdByInviteId[invite.id];
    if (!selectedBagId) return;
    setClaimingInviteId(invite.id);
    try {
      const claimed = await put<ClaimedInvite>(`/game_invites/${invite.id}/claim`, { bag_id: Number(selectedBagId) });
      router.push(`/play/room?room=${claimed.room}&player=1`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setClaimingInviteId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Incoming Invites</h2>
      {invites.length === 0 && <RajaTableMessage text="No pending invites." muted />}
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-end gap-4 border border-raja-chrome-border p-3">
          <p className="flex-1 font-sans-serif text-sm text-raja-chrome-text">
            {invite.inviter_display_name ?? 'Unknown player'} invited you to a game
          </p>
          <RajaDropdown
            id={`accept-invite-bag-${invite.id}`}
            label="Bag"
            options={bagOptions}
            value={selectedBagIdByInviteId[invite.id] ?? ''}
            onChange={(e) => setSelectedBagIdByInviteId((prev) => ({ ...prev, [invite.id]: e.target.value }))}
            placeholder="Select a bag"
            disabled={bags.length === 0}
          />
          <RajaButton
            variant="action"
            text="Accept"
            disabled={!selectedBagIdByInviteId[invite.id] || claimingInviteId === invite.id}
            loading={claimingInviteId === invite.id}
            onClick={() => handleAccept(invite)}
          />
        </div>
      ))}
    </section>
  );
}
