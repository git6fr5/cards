'use client';

import { useDraggable } from '@dnd-kit/core';
import RajaArchetypePill from '@/components/ui/RajaArchetypePill';
import RajaCostCircle from '@/components/ui/RajaCostCircle';
import RajaBadge from '@/components/ui/RajaBadge';
import type { PieceFull } from './types';

interface BagTableRowProps {
  piece: PieceFull | null;
  quantity: number;
  readOnly?: boolean;
}

export default function BagTableRow({ piece, quantity, readOnly = false }: BagTableRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: piece ? `bag-row-${piece.name}` : 'bag-row-missing-king',
    data: piece ? { piece, source: 'bag' } : undefined,
    disabled: !piece || readOnly,
  });

  if (!piece) {
    return (
      <tr className="border-b border-raja-chrome-border">
        <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-error truncate">Missing King</td>
        <td className="px-3 py-2 text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-muted">N/A</td>
      </tr>
    );
  }

  const opacity = isDragging ? 'opacity-40' : '';
  const cursor = readOnly ? '' : 'cursor-grab';

  return (
    <tr
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`border-b border-raja-chrome-border ${cursor} ${opacity}`}
    >
      <td className="px-3 py-2 font-serif text-sm text-raja-chrome-text truncate">{piece.name}</td>
      <td className="px-3 py-2"><RajaArchetypePill archetype={piece.archetype} /></td>
      <td className="px-3 py-2"><RajaCostCircle value={piece.attributes.summon_cost} label="Summon cost" bgClassName="bg-raja-ink/50" /></td>
      <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-text">{piece.attributes.action_cost}</td>
      <td className="px-3 py-2"><RajaBadge text={piece.movement} /></td>
      <td className="px-3 py-2"><RajaBadge text={piece.trigger_type} /></td>
      <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-text">{quantity}</td>
    </tr>
  );
}
