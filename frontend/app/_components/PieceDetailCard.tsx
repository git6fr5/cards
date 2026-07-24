import MovementBoard from '@/app/_components/MovementBoard';
import type { MovementPattern } from '@/app/_components/MovementBoard';
import RajaCostCircle from '@/components/ui/RajaCostCircle';
import RajaArchetypeIcon from '@/components/ui/RajaArchetypeIcon';
import RajaAbilityText from '@/components/ui/RajaAbilityText';
import type { PieceFull } from './types';

interface PieceDetailCardProps {
  piece: PieceFull;
  className?: string;
}

export default function PieceDetailCard({ piece, className = '' }: PieceDetailCardProps) {
  const pattern = piece.movement_type.toLowerCase() as MovementPattern;

  return (
    <div className={`relative flex w-[5.5cm] h-[8cm] flex-col items-center justify-center gap-0.5 border-[3px] border-raja-orange bg-raja-chrome-panel px-1 pt-7 pb-7 ${className}`}>
      <RajaArchetypeIcon archetype={piece.archetype} className="absolute left-0.5 top-0.5" />
      <RajaCostCircle value={piece.attributes.action_cost} label="Action cost" className="absolute right-0.5 top-0.5" />
      <RajaCostCircle
        value={piece.attributes.summon_cost}
        label="Summon cost"
        bgClassName="bg-raja-ink/50"
        className="absolute left-0.5 bottom-0.5"
      />
      <RajaArchetypeIcon archetype={piece.archetype} className="absolute right-0.5 bottom-0.5" />

      <p className="absolute top-0.5 left-8 right-8 font-serif text-sm font-bold uppercase text-raja-chrome-text text-center leading-tight">
        {piece.name}
      </p>
      <MovementBoard pattern={pattern} distance={piece.movement_distance} size="sm" />
      <RajaAbilityText dsl={piece.ability} />
    </div>
  );
}
