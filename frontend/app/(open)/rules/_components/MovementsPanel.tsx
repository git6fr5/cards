import RajaSection from '@/components/layout/RajaSection';
import MovementDiagram from './MovementDiagram';
import TabGroup from './TabGroup';

const TABS = [
  {
    label: 'Square',
    pattern: 'square' as const,
    description: 'A square-moving piece steps along the 4 straight and 4 diagonal directions at once, like a queen in chess.',
  },
  {
    label: 'Forward',
    pattern: 'forward' as const,
    description: 'A forward-moving piece steps in a single fixed direction only. It cannot move sideways, backward, or diagonally.',
  },
  {
    label: 'Cross',
    pattern: 'cross' as const,
    description: 'A cross-moving piece steps along the 4 straight directions. A piece in the way blocks the path at distance 2 or more.',
  },
  {
    label: 'Diagonal',
    pattern: 'diagonal' as const,
    description: 'A diagonal-moving piece steps along the 4 diagonal directions. Like the cross pattern, longer moves can be blocked by a piece sitting between the start and end square.',
  },
];

export default function MovementsPanel() {
  return (
    <RajaSection className="flex h-full flex-col gap-3 border-2 border-raja-chrome-action p-6">
      <h2 className="font-serif text-xl font-bold text-raja-chrome-text">Movements</h2>
      <TabGroup
        tabs={TABS.map((tab) => ({
          label: tab.label,
          content: (
            <div className="flex flex-wrap items-center gap-6">
              <MovementDiagram pattern={tab.pattern} label={tab.label} />
              <p className="font-sans-serif text-sm text-raja-chrome-muted max-w-xs">{tab.description}</p>
            </div>
          ),
        }))}
      />
    </RajaSection>
  );
}
