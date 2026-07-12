import { useEffect, useId, useState } from 'react';
import type { Archetype, BodyColor, PieceType } from '@/utils/archetypes';
import { pieceFilterId } from './metalThemes';

const TILE_COUNT: Record<'sm' | 'md' | 'lg', number> = { sm: 0, md: 8, lg: 4 };
const RING_THICKNESS = 7;

// Matches each size's `border-*` width in PieceToken's SIZE_CLASSES. `inset-0` positions
// against the parent's padding box (inside the border) regardless of box-sizing, so without
// this the ring pattern maps onto the coin's inner circle instead of its true outer edge.
const BORDER_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 3, md: 4, lg: 6 };

interface RingBorderProps {
  size:      'sm' | 'md' | 'lg';
  pieceType: PieceType;
  archetype: Archetype;
  bodyColor: BodyColor;
}

function circlePath(r: number): string {
  return `M 50,${50 - r} A ${r},${r} 0 1,0 50,${50 + r} A ${r},${r} 0 1,0 50,${50 - r} Z`;
}

export default function RingBorder({ size, pieceType, archetype, bodyColor }: RingBorderProps) {
  const clipId = useId();
  const count = TILE_COUNT[size];

  // Traced from a full-bleed, seamless 8:1 tileable strip (no letterboxing) — same emboss
  // filter as the coin art/ring text, so the rim reads as the same lit metal as the rest
  // of the coin instead of a flat overlay.
  const motifSrc = `/coin_border_${pieceType.name.toLowerCase()}.svg`;

  const [motifFailed, setMotifFailed] = useState(false);
  useEffect(() => setMotifFailed(false), [motifSrc]);

  if (count === 0 || motifFailed) return null;

  const radius = 48;
  const tileWidth = (2 * Math.PI * radius) / count;
  const borderPx = 0; // BORDER_PX[size];
  const filterId = pieceFilterId(bodyColor, archetype);

  // Tiles are straight rectangles bent around the circle, so their union has a jagged,
  // `count`-sided outline on both edges. Clipping to a true annulus (two concentric circles,
  // combined with evenodd so the inner one punches a hole) forces both the outer and inner
  // boundary to be perfect circles regardless of each tile's straight edges.
  const outerRadius = radius + RING_THICKNESS / 2;
  const innerRadius = radius - RING_THICKNESS / 2;

  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute"
      style={{ top: -borderPx, left: -borderPx, right: -borderPx, bottom: -borderPx, filter: `url(#${filterId})` }}
    >
      <defs>
        <clipPath id={clipId}>
          <path fillRule="evenodd" d={`${circlePath(outerRadius)} ${circlePath(innerRadius)}`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: count }, (_, i) => {
          const angle = (360 / count) * i;
          return (
            <g key={i} transform={`rotate(${angle} 50 50) translate(50 ${50 - radius})`}>
              <image
                href={motifSrc}
                x={-tileWidth / 2}
                y={-RING_THICKNESS / 2}
                width={tileWidth}
                height={RING_THICKNESS}
                preserveAspectRatio="none"
                onError={() => setMotifFailed(true)}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
