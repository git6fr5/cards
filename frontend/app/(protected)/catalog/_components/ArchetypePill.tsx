import { ARCHETYPES } from '@/utils/archetypes';

interface ArchetypePillProps {
  archetype: string;
}

export default function ArchetypePill({ archetype }: ArchetypePillProps) {
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
