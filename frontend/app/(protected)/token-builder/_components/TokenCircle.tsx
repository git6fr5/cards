import type { Archetype, BodyColor, PieceType } from '../types';

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8  h-8  border-[3px]',
  md: 'w-12 h-12 border-4',
  lg: 'w-20 h-20 border-[6px]',
};

const BODY_CLASSES: Record<BodyColor, string> = {
  white: 'bg-kingkiller-white text-kingkiller-black',
  black: 'bg-kingkiller-black text-kingkiller-white',
};

const ICON_CLASSES: Record<'sm' | 'md' | 'lg', { icon: string }> = {
  sm: { icon: 'w-4 h-4'   },
  md: { icon: 'w-5 h-5'   },
  lg: { icon: 'w-7 h-7'   },
};

interface TokenCircleProps {
  archetype:  Archetype;
  pieceType:  PieceType;
  bodyColor:  BodyColor;
  size?:      'sm' | 'md' | 'lg';
}

export default function TokenCircle({ archetype, pieceType, bodyColor, size = 'md' }: TokenCircleProps) {
  const { icon: iconCls } = ICON_CLASSES[size];
  const ArchetypeIcon    = archetype.Icon;

  return (
    <div
      className={`flex items-center justify-center rounded-full ${SIZE_CLASSES[size]} ${BODY_CLASSES[bodyColor]}`}
      style={{ borderColor: archetype.color }}
    >
      <ArchetypeIcon
        className={`${iconCls} [&_*]:fill-current`}
        strokeWidth={0}
        style={{ color: archetype.color }}
      />
    </div>
  );
}
