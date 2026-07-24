import { translateAbility } from '@/utils/abilityTranslator';
import type { TranslatedLine } from '@/utils/abilityTranslator';

interface RajaAbilityTextProps {
  dsl: string;
  raw?: boolean;
  className?: string;
}

interface AbilityLineProps {
  line: TranslatedLine;
}

function AbilityLine({ line }: AbilityLineProps) {
  if (!line.text) return null;
  const color = line.isFallback ? 'text-raja-chrome-error' : 'text-raja-chrome-text';
  return (
    <p className={`w-full font-sans-serif text-xs whitespace-pre-line text-center leading-tight ${color}`}>
      {line.text}
    </p>
  );
}

export default function RajaAbilityText({ dsl, raw = false, className = '' }: RajaAbilityTextProps) {
  if (raw) {
    const lines = dsl.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        {lines.map((line) => (
          <p key={line} className="w-full font-monospace text-xs text-raja-chrome-text whitespace-pre-line text-center leading-tight">
            {line}
          </p>
        ))}
      </div>
    );
  }

  const translated = translateAbility(dsl);
  if (!translated) return null;

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <AbilityLine line={translated.trigger} />
      <AbilityLine line={translated.effect} />
      <AbilityLine line={translated.target} />
    </div>
  );
}
