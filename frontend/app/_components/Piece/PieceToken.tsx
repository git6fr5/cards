'use client';

import { useEffect, useState } from 'react';
import type { Archetype, BodyColor, PieceType } from '@/utils/archetypes';
import { METAL_THEMES } from './metalThemes';
import { getHighlightPosition } from './lightSource';
import { randomCoinTexture } from './coinTextures';
import { getPieceArtSrc } from './pieceArt';
import NameText from './NameText';
import AbilityText from './AbilityText';
import RingBorder from './RingBorder';

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8  h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
};

const ICON_CLASSES: Record<'sm' | 'md' | 'lg', { icon: string }> = {
  sm: { icon: 'w-6  h-6'  },
  md: { icon: 'w-9  h-9'  },
  lg: { icon: 'w-16 h-16' },
};

interface PieceTokenProps {
  name:       string;
  archetype:  Archetype;
  pieceType:  PieceType;
  bodyColor:  BodyColor;
  size?:        'sm' | 'md' | 'lg';
  nameText?:    string;
  abilityText?: string;
}

export default function PieceToken({ name, archetype, pieceType, bodyColor, size = 'md', nameText, abilityText }: PieceTokenProps) {
  const { icon: iconCls } = ICON_CLASSES[size];
  const ArchetypeIcon    = archetype.Icon;
  const theme            = METAL_THEMES[bodyColor];

  const [texture, setTexture] = useState<string | null>(null);
  useEffect(() => setTexture(randomCoinTexture()), []);

  const artSrc = getPieceArtSrc(name);
  const [artFailed, setArtFailed] = useState(false);
  useEffect(() => setArtFailed(false), [artSrc]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full ${SIZE_CLASSES[size]}`}
      style={{
        background: `radial-gradient(circle at ${getHighlightPosition()}, ${theme.gradientFrom}, ${theme.gradientTo})`,
        boxShadow: `inset 0 1px 1px ${theme.rimHighlight}, inset 0 -1px 2px ${theme.rimShadow}`,
      }}
    >
      {/* <RingBorder size={size} pieceType={pieceType} bodyColor={bodyColor} /> */}
      <NameText text={nameText ?? name} size={size} />
      {abilityText && <AbilityText text={abilityText} size={size} />}
      {artFailed ? (
        <ArchetypeIcon
          className={`${iconCls} [&_*]:fill-current`}
          strokeWidth={0}
          style={{ filter: `url(#${theme.filterId})` }}
        />
      ) : (
        <img
          src={artSrc}
          alt=""
          className={`${iconCls} object-contain`}
          style={{ filter: `url(#${theme.filterId})` }}
          onError={() => setArtFailed(true)}
        />
      )}
      {texture && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-50"
          style={{ backgroundImage: `url(${texture})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
    </div>
  );
}
