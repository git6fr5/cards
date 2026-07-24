'use client';

import RajaButton from '@/components/ui/RajaButton';
import RajaSection from '@/components/layout/RajaSection';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function HomeHero() {
  const { user } = useCurrentUser();

  return (
    <RajaSection className="min-h-screen flex items-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-8 py-16 text-center">
        <h1 className="font-serif text-5xl text-raja-chrome-text tracking-wide">RAJA</h1>
        <p className="max-w-sm font-sans-serif text-sm text-raja-chrome-muted">
          A card and chess battle arena. Draft your bag, deploy your pieces, capture the King.
        </p>
        <div className="flex gap-4">
          {user ? (
            <RajaButton variant="link" href="/account" text="Go to Account" />
          ) : (
            <RajaButton variant="link" href="/auth" text="Sign In" />
          )}
          <RajaButton variant="link" href="/rules" alt text="Rules" />
        </div>
      </div>
    </RajaSection>
  );
}
