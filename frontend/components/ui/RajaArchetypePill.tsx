import { ARCHETYPES } from '@/utils/archetypes';

interface RajaArchetypePillProps {
  archetype: string;
}

export default function RajaArchetypePill({ archetype }: RajaArchetypePillProps) {
  const color = ARCHETYPES[archetype].color;

  return (
    <span
      className="inline-block px-2 py-0.5 font-sans-serif text-xs font-medium rounded-full whitespace-nowrap"
      style={{ backgroundColor: `${color}80`, color }}
    >
      {archetype}
    </span>
  );
}
