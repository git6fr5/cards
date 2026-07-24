import { translateAbility } from '@/utils/abilityTranslator';
import type { TranslatedLine } from '@/utils/abilityTranslator';

interface RajaAbilityTextProps {
  dsl: string;
  className?: string;
}

interface AbilityLineProps {
  line: TranslatedLine;
}

function AbilityLine({ line }: AbilityLineProps) {
  if (!line.text) return null;
  const color = line.isFallback ? 'text-raja-chrome-error' : 'text-raja-chrome-text';
  return (
    <p className={`font-sans-serif text-xs whitespace-pre-line text-center leading-tight ${color}`}>
      {line.text}
    </p>
  );
}

export default function RajaAbilityText({ dsl, className = '' }: RajaAbilityTextProps) {
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
