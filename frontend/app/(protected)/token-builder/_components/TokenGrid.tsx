import { Triangle } from 'lucide-react';
import type { Archetype, BodyColor, Effect, PieceType } from '../types';
import TokenCircle from './TokenCircle';

type DiagOffset = (i: number, count: number, arrowPx: number) => number;

interface DirectionConfig {
  containerCls: string;
  stackCls:     string;
  iconCls:      string;
  diagOffset?:  DiagOffset;
}

const DIRECTIONS: Record<string, DirectionConfig> = {
  // Diagonals: diagOffset produces per-arrow marginLeft so they stack along their axis
  '0-0': { containerCls: 'absolute top-[6px] left-[6px]',                  stackCls: 'flex flex-col',         iconCls: '-rotate-45',        diagOffset: (i, _, px) => i * px            },
  '0-1': { containerCls: 'absolute top-0.5 left-1/2 -translate-x-1/2',    stackCls: 'flex flex-col',         iconCls: ''                                                                 },
  '0-2': { containerCls: 'absolute top-[6px] right-[6px]',                 stackCls: 'flex flex-col',         iconCls: 'rotate-45',         diagOffset: (i, n, px) => (n - 1 - i) * px },
  '1-0': { containerCls: 'absolute top-1/2 left-0.5 -translate-y-1/2',    stackCls: 'flex flex-row',         iconCls: '-rotate-90'                                                      },
  '1-2': { containerCls: 'absolute top-1/2 right-0.5 -translate-y-1/2',   stackCls: 'flex flex-row-reverse', iconCls: 'rotate-90'                                                       },
  '2-0': { containerCls: 'absolute bottom-[6px] left-[6px]',               stackCls: 'flex flex-col-reverse', iconCls: '-rotate-[135deg]',  diagOffset: (i, _, px) => i * px            },
  '2-1': { containerCls: 'absolute bottom-0.5 left-1/2 -translate-x-1/2', stackCls: 'flex flex-col-reverse', iconCls: 'rotate-180'                                                      },
  '2-2': { containerCls: 'absolute bottom-[6px] right-[6px]',              stackCls: 'flex flex-col-reverse', iconCls: 'rotate-[135deg]',   diagOffset: (i, n, px) => (n - 1 - i) * px },
};

interface TokenGridProps {
  movement:  number[][];
  effect:    (Effect | null)[][];
  archetype: Archetype;
  pieceType: PieceType;
  bodyColor: BodyColor;
}

export default function TokenGrid({ movement, effect, archetype, pieceType, bodyColor }: TokenGridProps) {
  return (
    <div className="grid grid-cols-5 gap-px bg-kingkiller-stone p-px">
      {[0, 1, 2, 3, 4].flatMap((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const key      = `${row}-${col}`;
          const isInner  = row >= 1 && row <= 3 && col >= 1 && col <= 3;
          const isCenter = row === 2 && col === 2;

          if (isCenter) {
            return (
              <div key={key} className="relative flex h-14 w-14 items-center justify-center bg-kingkiller-white">
                <TokenCircle archetype={archetype} pieceType={pieceType} bodyColor={bodyColor} size="sm" />
                {[0, 1, 2].flatMap((mr) =>
                  [0, 1, 2].map((mc) => {
                    if (mr === 1 && mc === 1) return null;
                    const dKey  = `${mr}-${mc}`;
                    const count = movement[mr]?.[mc] ?? 0;
                    if (count === 0) return null;
                    const { containerCls, stackCls, iconCls, diagOffset } = DIRECTIONS[dKey];
                    const arrowPx = 10 / count;
                    return (
                      <div key={dKey} className={containerCls}>
                        <div className={`${stackCls} gap-0`}>
                          {Array.from({ length: count }, (_, i) => (
                            <Triangle
                              key={i}
                              className={`[&_*]:fill-current ${iconCls}`}
                              strokeWidth={0}
                              style={{
                                color:      archetype.color,
                                width:      arrowPx,
                                height:     arrowPx,
                                ...(diagOffset ? { marginLeft: diagOffset(i, count, arrowPx) } : {}),
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }),
                )}
              </div>
            );
          }

          if (isInner) {
            const eff = effect[row - 1]?.[col - 1] ?? null;
            return (
              <div key={key} className="flex h-14 w-14 items-center justify-center bg-kingkiller-white">
                {eff && <eff.Icon className={`h-5 w-5 opacity-30 ${eff.color}`} />}
              </div>
            );
          }

          return (
            <div key={key} className="h-14 w-14 bg-kingkiller-hover opacity-40" />
          );
        }),
      )}
    </div>
  );
}
