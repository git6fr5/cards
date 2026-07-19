import RajaSection from '@/components/layout/RajaSection';

const ZONES = [
  { name: 'Bag', description: 'Your full deck of pieces, drawn at random rather than in a fixed order.' },
  { name: 'Shelf', description: 'Your hand of drawn pieces, capped at 5 and visible only to you, waiting to be summoned.' },
  { name: 'Board', description: 'The 7×7 grid where summoned pieces actually play out the game, visible to both players.' },
];

export default function ZonesPanel() {
  return (
    <RajaSection className="flex h-full flex-col gap-3 border border-raja-chrome-border p-6">
      <h2 className="font-serif text-xl font-bold text-raja-chrome-text">Game Zones</h2>
      <ol className="flex list-none flex-col gap-3">
        {ZONES.map((zone, i) => (
          <li key={zone.name} className="flex gap-3">
            <span className="font-monospace text-sm text-raja-chrome-action">{i + 1}.</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{zone.name}</span>
              <p className="font-sans-serif text-sm text-raja-chrome-text">{zone.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </RajaSection>
  );
}
