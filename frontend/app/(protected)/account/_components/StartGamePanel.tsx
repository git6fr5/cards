'use client';

import { useState } from 'react';
import { post } from '@/utils/api';
import RajaDropdown from '@/components/ui/RajaDropdown';
import RajaButton from '@/components/ui/RajaButton';
import type { Bag } from '@/app/_components/types';
import type { FriendEntry } from '../types';
import { friendCounterpartName } from '../types';

interface StartGamePanelProps {
  bags: Bag[];
  friends: FriendEntry[];
  currentPlayerId: number;
  onStarted: (message: string) => void;
  onError: (message: string) => void;
}

interface CreatedGame {
  id: number;
}

export default function StartGamePanel({ bags, friends, currentPlayerId, onStarted, onError }: StartGamePanelProps) {
  const [selectedBagId, setSelectedBagId] = useState('');
  const [selectedFriendPlayerId, setSelectedFriendPlayerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bagOptions = bags.map((bag) => ({ value: String(bag.id), label: bag.name }));
  const friendOptions = friends.map((friend) => ({
    value: String(friend.requester_player_id === currentPlayerId ? friend.recipient_player_id : friend.requester_player_id),
    label: friendCounterpartName(friend, currentPlayerId),
  }));
  const canSubmit = selectedBagId !== '' && selectedFriendPlayerId !== '' && !isSubmitting;

  async function handleStartGame() {
    setIsSubmitting(true);
    try {
      const game = await post<CreatedGame>('/games', { bag_id: Number(selectedBagId) });
      await post('/game_invites', { game_id: game.id, invitee_player_id: Number(selectedFriendPlayerId) });
      onStarted('Invite sent — waiting for your friend to accept.');
      setSelectedBagId('');
      setSelectedFriendPlayerId('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Start a New Game</h2>
      {bags.length === 0 && (
        <p className="font-sans-serif text-sm text-raja-chrome-muted">
          Build a bag in the catalog before starting a game.
        </p>
      )}
      {friends.length === 0 && (
        <p className="font-sans-serif text-sm text-raja-chrome-muted">
          Add a friend before you can invite one to a game.
        </p>
      )}
      <div className="flex items-end gap-4">
        <RajaDropdown
          id="start-game-bag"
          label="Bag"
          options={bagOptions}
          value={selectedBagId}
          onChange={(e) => setSelectedBagId(e.target.value)}
          placeholder="Select a bag"
          disabled={bags.length === 0}
          className="flex-1"
        />
        <RajaDropdown
          id="start-game-friend"
          label="Friend"
          options={friendOptions}
          value={selectedFriendPlayerId}
          onChange={(e) => setSelectedFriendPlayerId(e.target.value)}
          placeholder="Select a friend"
          disabled={friends.length === 0}
          className="flex-1"
        />
        <RajaButton
          variant="action"
          text="Invite"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={handleStartGame}
        />
      </div>
    </section>
  );
}
