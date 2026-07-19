import RajaButton from '@/components/ui/RajaButton';
import RajaSection from '@/components/layout/RajaSection';

const TURN_STEPS = [
  'Your total mana grows by 1.',
  'Your current mana refills to that new total.',
  'You spend your mana to summon or move pieces.',
];

export default function HomeFeature() {
  return (
    <RajaSection className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-8 py-16 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start gap-4 text-left">
          <h2 className="font-serif text-3xl font-bold text-raja-chrome-text">Master the Board</h2>
          <p className="max-w-sm font-sans-serif text-sm text-raja-chrome-muted">
            Two players draft pieces at random from their own bag and battle across a 7×7 board.
          </p>
          <ol className="flex list-none flex-col gap-1 text-left">
            {TURN_STEPS.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-monospace text-sm text-raja-chrome-action">{i + 1}.</span>
                <span className="font-sans-serif text-sm text-raja-chrome-text">{step}</span>
              </li>
            ))}
          </ol>
          <RajaButton variant="link" href="/rules" alt text="View Full Rules" />
        </div>
        <div className="relative aspect-square w-full max-w-sm shrink-0">
          <img
            src="/coin_border_king.png"
            alt=""
            className="absolute left-[18%] top-[22%] w-28 rotate-[-6deg] drop-shadow-lg"
          />
          <img
            src="/ancient_dragon.png"
            alt=""
            className="absolute right-[8%] top-[2%] w-24 rotate-[10deg] drop-shadow-lg"
          />
          <img
            src="/goblin_warrior.png"
            alt=""
            className="absolute bottom-[12%] left-[2%] w-20 rotate-[-12deg] drop-shadow-lg"
          />
          <img
            src="/goblin_bomber.png"
            alt=""
            className="absolute bottom-[2%] right-[16%] w-20 rotate-[8deg] drop-shadow-lg"
          />
        </div>
      </div>
    </RajaSection>
  );
}
