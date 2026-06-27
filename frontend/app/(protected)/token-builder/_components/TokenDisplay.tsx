import type { TokenData } from '../types';
import TokenCircle from './TokenCircle';
import TokenGrid from './TokenGrid';

interface TokenDisplayProps {
  token: TokenData;
}

export default function TokenDisplay({ token }: TokenDisplayProps) {
  const { name, archetype, piece_type, bodyColor, movement, effect } = token;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <TokenCircle archetype={archetype} pieceType={piece_type} bodyColor={bodyColor} size="lg" />
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
        movement={movement}
        effect={effect}
        archetype={archetype}
        pieceType={piece_type}
        bodyColor={bodyColor}
      />
    </div>
  );
}
