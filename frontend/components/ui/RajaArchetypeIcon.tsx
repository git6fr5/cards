import { ARCHETYPES } from '@/utils/archetypes';

interface RajaArchetypeIconProps {
  archetype: string;
  className?: string;
}

export default function RajaArchetypeIcon({ archetype, className = '' }: RajaArchetypeIconProps) {
  const { Icon, color } = ARCHETYPES[archetype];

  return (
    <div className={`flex h-7 w-7 items-center justify-center ${className}`}>
      <Icon size={18} color={color} />
    </div>
  );
}
