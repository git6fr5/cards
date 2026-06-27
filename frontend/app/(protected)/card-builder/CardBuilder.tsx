'use client';

import { useState } from 'react';
import type { Roundness, BorderConfig, ArtInset } from './types';
import CardFrame from './_components/CardFrame';
import BorderRow from './_components/BorderRow';

const CARD_NAME     = 'Iron Fist';
const CARD_TEXT     = 'Strike: Deal 3 damage to target creature.\n\nIf this creature has haste, deal 5 instead.';
const CARD_MANA     = 4;
const CARD_MOVEMENT = '⚡';

const ROUNDNESS_OPTIONS: Roundness[] = ['none', 'sm', 'md', 'lg'];
const ART_INSET_OPTIONS: ArtInset[]  = [0, 1, 2, 3, 4];

const DEFAULT_BORDERS: [BorderConfig, BorderConfig, BorderConfig] = [
  { color: 'kingkiller-gold',     width: 2 },
  { color: 'kingkiller-obsidian', width: 2 },
  { color: 'kingkiller-gold',     width: 1 },
];

const DEFAULT_ART_BORDERS: [BorderConfig, BorderConfig, BorderConfig] = [
  { color: 'kingkiller-gold',     width: 1 },
  { color: 'kingkiller-obsidian', width: 1 },
  { color: 'kingkiller-gold',     width: 1 },
];

export default function CardBuilder() {
  const [roundness, setRoundness]   = useState<Roundness>('none');
  const [borders, setBorders]       = useState<[BorderConfig, BorderConfig, BorderConfig]>(DEFAULT_BORDERS);
  const [artInset, setArtInset]     = useState<ArtInset>(2);
  const [artBorders, setArtBorders] = useState<[BorderConfig, BorderConfig, BorderConfig]>(DEFAULT_ART_BORDERS);

  const updateBorder = (index: 0 | 1 | 2, patch: Partial<BorderConfig>) => {
    setBorders(prev => {
      const next: [BorderConfig, BorderConfig, BorderConfig] = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const updateArtBorder = (index: 0 | 1 | 2, patch: Partial<BorderConfig>) => {
    setArtBorders(prev => {
      const next: [BorderConfig, BorderConfig, BorderConfig] = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-kingkiller-black py-12">
      <CardFrame
        name={CARD_NAME}
        text={CARD_TEXT}
        mana={CARD_MANA}
        movement={CARD_MOVEMENT}
        roundness={roundness}
        borders={borders}
        artInset={artInset}
        artBorders={artBorders}
      />

      <div className="flex gap-8 border border-kingkiller-stone p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">Frame — borders</span>
            <BorderRow label="outer"  config={borders[0]} onChange={(p) => updateBorder(0, p)} />
            <BorderRow label="middle" config={borders[1]} onChange={(p) => updateBorder(1, p)} />
            <BorderRow label="inner"  config={borders[2]} onChange={(p) => updateBorder(2, p)} />
          </div>
          <div className="flex flex-col gap-2 border-t border-kingkiller-stone pt-4">
            <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">Frame — roundness</span>
            <div className="flex gap-1">
              {ROUNDNESS_OPTIONS.map((option) => {
                const isActive = option === roundness;
                const cls = isActive
                  ? 'border-kingkiller-gold bg-kingkiller-gold text-kingkiller-black'
                  : 'border-kingkiller-stone text-kingkiller-grey-muted hover:border-kingkiller-gold/50 hover:text-kingkiller-white';
                return (
                  <button key={option} onClick={() => setRoundness(option)} className={`border px-3 py-1 font-garamond text-xs font-medium ${cls}`}>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-px bg-kingkiller-stone" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">Art — borders</span>
            <BorderRow label="outer"  config={artBorders[0]} onChange={(p) => updateArtBorder(0, p)} />
            <BorderRow label="middle" config={artBorders[1]} onChange={(p) => updateArtBorder(1, p)} />
            <BorderRow label="inner"  config={artBorders[2]} onChange={(p) => updateArtBorder(2, p)} />
          </div>
          <div className="flex flex-col gap-2 border-t border-kingkiller-stone pt-4">
            <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">Art — inset</span>
            <div className="flex gap-1">
              {ART_INSET_OPTIONS.map((option) => {
                const isActive = option === artInset;
                const cls = isActive
                  ? 'border-kingkiller-gold bg-kingkiller-gold text-kingkiller-black'
                  : 'border-kingkiller-stone text-kingkiller-grey-muted hover:border-kingkiller-gold/50 hover:text-kingkiller-white';
                return (
                  <button key={option} onClick={() => setArtInset(option)} className={`border px-3 py-1 font-garamond text-xs font-medium ${cls}`}>
                    {option}mm
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
