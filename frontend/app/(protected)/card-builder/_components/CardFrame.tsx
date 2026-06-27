import type { Roundness, BorderConfig, ArtInset } from '../types';
import { borderCls } from './border-utils';
import CardArt from './CardArt';
import CardName from './CardName';
import CardText from './CardText';
import CardMana from './CardMana';
import CardMovement from './CardMovement';

const ROUNDED: Record<Roundness, string> = {
  none: 'rounded-none',
  sm:   'rounded-sm',
  md:   'rounded-md',
  lg:   'rounded-lg',
};

interface CardFrameProps {
  name: string;
  text: string;
  mana: number;
  movement: string;
  roundness?: Roundness;
  borders: [BorderConfig, BorderConfig, BorderConfig];
  artInset: ArtInset;
  artBorders: [BorderConfig, BorderConfig, BorderConfig];
}

export default function CardFrame({ name, text, mana, movement, roundness = 'none', borders, artInset, artBorders }: CardFrameProps) {
  const rounded = ROUNDED[roundness];
  const [b1, b2, b3] = borders;

  return (
    <div className={`flex h-[85mm] w-[55mm] flex-col overflow-hidden ${rounded} ${borderCls(b1)}`}>
      <div className={`flex flex-1 flex-col overflow-hidden ${rounded} ${borderCls(b2)}`}>
        <div className={`relative flex flex-1 flex-col overflow-hidden bg-kingkiller-obsidian ${rounded} ${borderCls(b3)}`}>
          <CardArt inset={artInset} borders={artBorders} />
          <CardName name={name} />
          <CardText text={text} />
          <div className="flex shrink-0 items-center justify-between px-[2mm] pb-[2mm]">
            <CardMana value={mana} />
            <CardMovement symbol={movement} />
          </div>
        </div>
      </div>
    </div>
  );
}
