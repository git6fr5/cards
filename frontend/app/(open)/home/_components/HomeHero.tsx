import RajaButton from '@/components/ui/RajaButton';
import RajaSection from '@/components/layout/RajaSection';

export default function HomeHero() {
  return (
    <RajaSection alt className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-8 py-16 md:flex-row md:items-center md:justify-between">
        <img src="/ancient_dragon.png" alt="" className="w-full max-w-sm shrink-0 mix-blend-multiply" />
        <div className="flex flex-col items-start gap-4 text-left">
          <img src="/raja.svg" alt="Raja" className="w-64 invert md:w-80" />
          <p className="max-w-sm font-sans-serif text-sm text-raja-chrome-bg opacity-muted">
            A card and chess battle arena. Draft your bag, deploy your pieces, capture the King.
          </p>
          <div className="flex gap-4">
            <RajaButton variant="link" href="/play" text="Play" />
            <RajaButton variant="link" href="/auth" alt text="Sign In" />
          </div>
        </div>
      </div>
    </RajaSection>
  );
}
