import { KING_ROLE_TYPE } from '../types';
import type { PieceFull } from '../types';

interface BagTableRowProps {
  piece: PieceFull | null;
  quantity: number;
  canIncrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function BagTableRow({ piece, quantity, canIncrement, onIncrement, onDecrement }: BagTableRowProps) {
  if (!piece) {
    return (
      <tr className="border-b border-raja-chrome-border">
        <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-error">Missing King</td>
        <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-muted">N/A</td>
        <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-muted">N/A</td>
      </tr>
    );
  }

  const isKing = piece.role_type === KING_ROLE_TYPE;

  return (
    <tr className="border-b border-raja-chrome-border">
      <td className="px-3 py-2 font-serif text-sm text-raja-chrome-text">{piece.name}</td>
      <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-text">{piece.archetype}</td>
      <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-text">{piece.attributes.summon_cost}</td>
      <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-text">{piece.movement}</td>
      <td className="px-3 py-2 font-sans-serif text-sm text-raja-chrome-text">{piece.trigger_type}</td>
      <td className="px-3 py-2 font-monospace text-sm text-raja-chrome-text">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDecrement} className="text-raja-chrome-muted hover:text-raja-chrome-text">
            {isKing ? 'Remove' : '−'}
          </button>
          {!isKing && (
            <>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={onIncrement}
                disabled={!canIncrement}
                className="text-raja-chrome-muted hover:text-raja-chrome-text disabled:opacity-disabled disabled:cursor-not-allowed"
              >
                +
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
