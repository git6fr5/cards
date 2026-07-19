'use client';

import { useState } from 'react';
import type { Bag } from '../types';

interface BagTabsProps {
  bags: Bag[];
  selectedBagId: number | null;
  onSelect: (bagId: number) => void;
  onCreate: () => void;
  onRename: (bagId: number, name: string) => void;
}

export default function BagTabs({ bags, selectedBagId, onSelect, onCreate, onRename }: BagTabsProps) {
  const [editingBagId, setEditingBagId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');

  function startEditing(bag: Bag) {
    setEditingBagId(bag.id);
    setDraftName(bag.name);
  }

  function commitEditing() {
    if (editingBagId !== null && draftName.trim()) {
      onRename(editingBagId, draftName.trim());
    }
    setEditingBagId(null);
  }

  return (
    <div className="flex items-center gap-1 border-b border-raja-chrome-border bg-raja-chrome-bg px-3 pt-2 overflow-x-auto shrink-0">
      {bags.map((bag) => {
        const isActive = bag.id === selectedBagId;
        const tabColor = isActive
          ? 'bg-raja-chrome-bg border-raja-chrome-border border-b-raja-chrome-bg text-raja-chrome-text'
          : 'bg-raja-chrome-panel border-transparent text-raja-chrome-muted hover:text-raja-chrome-text';
        return (
          <div
            key={bag.id}
            onClick={() => onSelect(bag.id)}
            onDoubleClick={() => startEditing(bag)}
            className={`relative px-3 py-1.5 border border-b-0 font-sans-serif text-sm cursor-pointer whitespace-nowrap ${tabColor}`}
          >
            {editingBagId === bag.id ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitEditing}
                onKeyDown={(e) => { if (e.key === 'Enter') commitEditing(); }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent outline-none w-24"
              />
            ) : (
              bag.name
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onCreate}
        className="px-3 py-1.5 font-sans-serif text-sm text-raja-chrome-action hover:opacity-80"
      >
        + New Bag
      </button>
    </div>
  );
}
