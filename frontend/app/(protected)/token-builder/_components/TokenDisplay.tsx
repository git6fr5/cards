import type { TokenData } from '../types';
import type { BodyColor } from '@/utils/archetypes';
import PieceToken from '@/app/_components/Piece';
import TokenGrid from './TokenGrid';

interface TokenDisplayProps {
  token:     TokenData;
  bodyColor: BodyColor;
}

export default function TokenDisplay({ token, bodyColor }: TokenDisplayProps) {
  const { name, archetype, piece_type, movement, ability } = token;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <PieceToken
          name={name}
          archetype={archetype}
          pieceType={piece_type}
          bodyColor={bodyColor}
          size="lg"
          abilityText={ability}
        />
        <div>
          <p className="text-lg font-semibold text-kingkiller-white">{name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border-2 border-kingkiller-white"
              style={{ backgroundColor: archetype.color }}
            />
            <span className="text-sm text-kingkiller-grey">{archetype.name}</span>
          </div>
        </div>
      </div>

      <TokenGrid
        name={name}
        movement={movement}
        archetype={archetype}
        pieceType={piece_type}
        bodyColor={bodyColor}
      />
    </div>
  );
}
