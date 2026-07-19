import RajaSection from '@/components/layout/RajaSection';

const TURN_STEPS = [
  'Your total mana grows by 1.',
  'Your current mana refills to that new total.',
  'You spend your mana to summon or move pieces.',
];

export default function OverviewPanel() {
  return (
    <RajaSection className="flex flex-col items-center gap-2 border border-raja-chrome-border p-4 text-center">
      <h2 className="font-serif text-2xl font-bold text-raja-chrome-text">How to Play</h2>
      <p className="font-sans-serif text-sm text-raja-chrome-muted max-w-md">
        Two players battle across a 7×7 board using pieces drawn at random from their own bag, much like drawing tiles onto a Scrabble rack.
      </p>
      <ol className="flex list-none flex-col gap-1 text-left">
        {TURN_STEPS.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="font-monospace text-sm text-raja-chrome-action">{i + 1}.</span>
            <span className="font-sans-serif text-sm text-raja-chrome-text">{step}</span>
          </li>
        ))}
      </ol>
      <p className="font-sans-serif text-sm text-raja-chrome-muted max-w-md">
        The game ends the moment either King is captured.
      </p>
    </RajaSection>
  );
}
