import RajaButton from '@/components/ui/RajaButton';
import RajaSection from '@/components/layout/RajaSection';

export default function HomeHero() {
  return (
    <RajaSection alt className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-8 py-16 md:flex-row md:items-center md:justify-between">
        <div className="aspect-square w-full max-w-sm shrink-0 rounded-lg border border-raja-chrome-border bg-raja-chrome-text bg-[url('/board_tex_0.png')] bg-cover bg-center bg-blend-multiply" />
        <div className="flex flex-col items-start gap-4 text-left">
          <h1 className="font-serif text-4xl font-bold tracking-wide text-raja-chrome-bg md:text-5xl">Raja</h1>
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
