import type { ArtInset, BorderConfig } from '../types';
import { borderCls } from './border-utils';

const INSET_CLASSES: Record<ArtInset, string> = {
  0: 'p-0',
  1: 'p-[1mm]',
  2: 'p-[2mm]',
  3: 'p-[3mm]',
  4: 'p-[4mm]',
};

interface CardArtProps {
  inset: ArtInset;
  borders: [BorderConfig, BorderConfig, BorderConfig];
}

export default function CardArt({ inset, borders }: CardArtProps) {
  const [b1, b2, b3] = borders;

  return (
    <div className={`shrink-0 h-1/2 ${INSET_CLASSES[inset]}`}>
      <div className={`h-full w-full ${borderCls(b1)}`}>
        <div className={`h-full w-full ${borderCls(b2)}`}>
          <div className={`h-full w-full bg-kingkiller-black ${borderCls(b3)}`} />
        </div>
      </div>
    </div>
  );
}
