import RajaHeader from '@/components/layout/RajaHeader';
import RajaButton from '@/components/forms/RajaButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-raja-chrome-bg flex flex-col items-center justify-center gap-8 p-8">
      <RajaHeader text="Raja" className="font-garamond text-3xl" />
      <p className="font-garamond text-sm text-raja-chrome-muted">
        A card and chess battle arena.
      </p>
      <div className="flex gap-4">
        <RajaButton variant="link" href="/auth" text="Sign In" />
        <RajaButton variant="link" href="/play" text="Play" />
      </div>
    </div>
  );
}
