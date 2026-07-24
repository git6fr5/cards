import MovementBoard from '@/app/_components/MovementBoard';
import type { MovementPattern } from '@/app/_components/MovementBoard';
import RajaCostCircle from '@/components/ui/RajaCostCircle';
import RajaArchetypeIcon from '@/components/ui/RajaArchetypeIcon';
import RajaAbilityText from '@/components/ui/RajaAbilityText';
import type { PieceFull } from './types';

interface PieceDetailCardProps {
  piece: PieceFull;
  showRawDsl?: boolean;
  className?: string;
}

export default function PieceDetailCard({ piece, showRawDsl = false, className = '' }: PieceDetailCardProps) {
  const pattern = piece.movement_type.toLowerCase() as MovementPattern;

  return (
    <div className={`relative w-[5.5cm] h-[8cm] border-[3px] border-raja-orange bg-raja-chrome-panel px-1 pt-7 pb-7 ${className}`}>
      <RajaArchetypeIcon archetype={piece.archetype} className="absolute left-0.5 top-0.5" />
      <RajaCostCircle value={piece.attributes.action_cost} label="Action cost" className="absolute right-0.5 top-0.5" />
      <RajaCostCircle
        value={piece.attributes.summon_cost}
        label="Summon cost"
        bgClassName="bg-raja-ink/50"
        className="absolute left-0.5 bottom-0.5"
      />
      <RajaArchetypeIcon archetype={piece.archetype} className="absolute right-0.5 bottom-0.5" />

      <p className="absolute top-0.5 left-8 right-8 h-7 flex items-center justify-center font-serif text-sm font-bold uppercase text-raja-chrome-text text-center leading-tight">
        {piece.name}
      </p>

      <div className="absolute inset-0 flex items-center justify-center px-1 pt-7 pb-7">
        <MovementBoard pattern={pattern} distance={piece.movement_distance} size="sm" />
      </div>

      <div className="absolute inset-x-1 bottom-7">
        <RajaAbilityText dsl={piece.ability} raw={showRawDsl} />
      </div>
    </div>
  );
}
