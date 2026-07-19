import RajaButton from '@/components/ui/RajaButton';
import RajaSection from '@/components/layout/RajaSection';

export default function Home() {
  return (
    <RajaSection
      alt
      className="min-h-screen bg-[url('/board_tex_0.png')] bg-cover bg-center bg-blend-multiply flex flex-col items-center justify-center gap-8 p-8"
    >
      <h1 className="text-4xl font-bold font-garamond tracking-wide text-raja-chrome-bg">Raja</h1>
      <p className="font-garamond text-sm text-raja-chrome-bg opacity-muted">
        A card and chess battle arena.
      </p>
      <div className="flex gap-4">
        <RajaButton variant="link" href="/auth" text="Sign In" />
        <RajaButton variant="link" href="/play" text="Play" />
      </div>
    </RajaSection>
  );
}
