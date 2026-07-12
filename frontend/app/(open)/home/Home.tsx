import RajaHeader from '@/components/layout/RajaHeader';
import RajaButton from '@/components/forms/RajaButton';
import RajaSection from '@/components/layout/RajaSection';

export default function Home() {
  return (
    <RajaSection
      alt
      className="min-h-screen bg-[url('/board_tex_0.png')] bg-cover bg-center bg-blend-multiply flex flex-col items-center justify-center gap-8 p-8"
    >
      <RajaHeader alt text="Raja" className="font-garamond text-4xl tracking-wide" />
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
