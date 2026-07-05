import KingkillerHeader from '@/components/layout/KingkillerHeader';
import KingkillerButton from '@/components/forms/KingkillerButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-kingkiller-black flex flex-col items-center justify-center gap-8 p-8">
      <KingkillerHeader alt text="Kingkiller" className="font-garamond text-3xl" />
      <p className="font-garamond text-sm text-kingkiller-grey-muted">
        A card and chess battle arena.
      </p>
      <div className="flex gap-4">
        <KingkillerButton variant="link" href="/auth" text="Sign In" />
        <KingkillerButton variant="link" href="/play" text="Play" />
      </div>
    </div>
  );
}
