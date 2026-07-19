'use client';

import { useState } from 'react';
import RajaDropdown from '@/components/ui/RajaDropdown';
import RajaButton from '@/components/ui/RajaButton';
import RajaModal from '@/components/layout/RajaModal';
import RajaTextField from '@/components/ui/RajaTextField';
import type { Bag } from '../types';

interface BagSelectorProps {
  bags: Bag[];
  selectedBagId: number | null;
  onSelect: (bagId: number) => void;
  onCreate: (name: string) => Promise<void>;
}

export default function BagSelector({ bags, selectedBagId, onSelect, onCreate }: BagSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBagName, setNewBagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bagOptions = bags.map((bag) => ({ value: String(bag.id), label: bag.name }));

  async function handleCreate() {
    setError(null);
    setIsCreating(true);
    try {
      await onCreate(newBagName.trim());
      setNewBagName('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <RajaDropdown
        id="bag-selector"
        label="Bag"
        placeholder="Select a bag"
        options={bagOptions}
        value={selectedBagId !== null ? String(selectedBagId) : ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="flex-1"
      />
      <RajaButton variant="action" text="New Bag" onClick={() => setIsModalOpen(true)} />

      {isModalOpen && (
        <RajaModal title="Create a new bag" onClose={() => setIsModalOpen(false)} maxWidth="sm">
          <div className="flex flex-col gap-4">
            {error && <p className="font-sans-serif text-sm text-raja-chrome-error">{error}</p>}
            <RajaTextField
              id="new-bag-name"
              label="Bag name"
              value={newBagName}
              onChange={(e) => setNewBagName(e.target.value)}
              placeholder="e.g. Goblin Rush"
              disabled={isCreating}
            />
            <RajaButton
              variant="action"
              text={isCreating ? 'Creating…' : 'Create Bag'}
              loading={isCreating}
              disabled={!newBagName.trim()}
              onClick={handleCreate}
              fullWidth
            />
          </div>
        </RajaModal>
      )}
    </div>
  );
}
