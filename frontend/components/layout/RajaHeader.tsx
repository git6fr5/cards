'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/utils/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import RajaButton from '@/components/ui/RajaButton';

interface RajaHeaderProps {
  showCatalog?: boolean;
  className?: string;
}

export default function RajaHeader({ showCatalog = false, className = '' }: RajaHeaderProps) {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  async function handleLogout() {
    await logout();
    router.push('/home');
  }

  const logoHref = user ? '/account' : '/home';

  return (
    <header className={`sticky top-0 z-pin flex items-center justify-between px-6 py-4 bg-raja-chrome-bg border-b border-raja-chrome-border ${className}`}>
      <Link href={logoHref} className="flex items-center">
        <img src="/raja.svg" alt="Raja" className="h-6 w-auto" />
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/rules" className="font-sans-serif text-sm text-raja-chrome-text hover:opacity-90">
          Rules
        </Link>
        {showCatalog && (
          <Link href="/catalog" className="font-sans-serif text-sm text-raja-chrome-text hover:opacity-90">
            Catalog
          </Link>
        )}
        {!isLoading && (
          user ? (
            <RajaButton variant="action" text="Logout" onClick={handleLogout} />
          ) : (
            <RajaButton variant="link" href="/auth" text="Sign In" />
          )
        )}
      </nav>
    </header>
  );
}
