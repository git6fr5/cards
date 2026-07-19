'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/utils/auth';

interface RajaHeaderProps {
  variant?: 'open' | 'protected';
  className?: string;
}

const NAV_LINKS: Record<'open' | 'protected', { text: string; href: string }[]> = {
  open: [
    { text: 'Rules', href: '/rules' },
    { text: 'Sign In', href: '/auth' },
    { text: 'Play', href: '/play' },
  ],
  protected: [
    { text: 'Play', href: '/play' },
    { text: 'Token Builder', href: '/token-builder' },
  ],
};

export default function RajaHeader({ variant = 'open', className = '' }: RajaHeaderProps) {
  const router = useRouter();
  const links = NAV_LINKS[variant];

  async function handleLogout() {
    await logout();
    router.push('/home');
  }

  return (
    <header className={`flex items-center justify-between px-6 py-4 bg-raja-chrome-bg border-b border-raja-chrome-border ${className}`}>
      <Link href="/home" className="font-garamond text-xl text-raja-chrome-text tracking-wide">
        Raja
      </Link>
      <nav className="flex items-center gap-6">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-raja-chrome-text hover:opacity-90">
            {link.text}
          </Link>
        ))}
        {variant === 'protected' && (
          <button onClick={handleLogout} className="text-sm text-raja-chrome-text hover:opacity-90">
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
