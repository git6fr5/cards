'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/utils/api';
import RajaDropdown from '@/components/ui/RajaDropdown';
import RajaButton from '@/components/ui/RajaButton';
import type { Bag, Game } from '@/app/_components/types';

interface StartCoopGamePanelProps {
  bags: Bag[];
  onStarted: (message: string) => void;
  onError: (message: string) => void;
}

export default function StartCoopGamePanel({ bags, onStarted, onError }: StartCoopGamePanelProps) {
  const router = useRouter();
  const [selectedBagIdSeat0, setSelectedBagIdSeat0] = useState('');
  const [selectedBagIdSeat1, setSelectedBagIdSeat1] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bagOptions = bags.map((bag) => ({ value: String(bag.id), label: bag.name }));
  const canSubmit = selectedBagIdSeat0 !== '' && selectedBagIdSeat1 !== '' && !isSubmitting;

  async function handleStartCoopGame() {
    setIsSubmitting(true);
    try {
      const game = await post<Game>('/games/coop', {
        bag_id_seat_0: Number(selectedBagIdSeat0),
        bag_id_seat_1: Number(selectedBagIdSeat1),
      });
      onStarted('Coop game started.');
      setSelectedBagIdSeat0('');
      setSelectedBagIdSeat1('');
      router.push(`/play/room?room=${game.room}&coop=true&seat_index=0`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Start a Coop Game</h2>
      {bags.length === 0 && (
        <p className="font-sans-serif text-sm text-raja-chrome-muted">
          Build a bag in the catalog before starting a game.
        </p>
      )}
      <div className="flex items-end gap-4">
        <RajaDropdown
          id="start-coop-game-bag-seat-0"
          label="Bag (Seat 0)"
          options={bagOptions}
          value={selectedBagIdSeat0}
          onChange={(e) => setSelectedBagIdSeat0(e.target.value)}
          placeholder="Select a bag"
          disabled={bags.length === 0}
          className="flex-1"
        />
        <RajaDropdown
          id="start-coop-game-bag-seat-1"
          label="Bag (Seat 1)"
          options={bagOptions}
          value={selectedBagIdSeat1}
          onChange={(e) => setSelectedBagIdSeat1(e.target.value)}
          placeholder="Select a bag"
          disabled={bags.length === 0}
          className="flex-1"
        />
        <RajaButton
          variant="action"
          text="Play Coop"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={handleStartCoopGame}
        />
      </div>
    </section>
  );
}
