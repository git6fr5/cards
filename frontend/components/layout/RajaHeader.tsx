'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/utils/auth';

interface RajaHeaderProps {
  variant?: 'open' | 'protected';
  className?: string;
}

interface NavLink {
  text: string;
  href: string;
  pill?: boolean;
}

const NAV_LINKS: Record<'open' | 'protected', NavLink[]> = {
  open: [
    { text: 'Home', href: '/home' },
    { text: 'Rules', href: '/rules' },
    { text: 'FAQ', href: '/faq' },
    { text: 'Sign In', href: '/auth', pill: true },
  ],
  protected: [
    { text: 'Play', href: '/play' },
    { text: 'Catalog', href: '/catalog' },
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
      <Link href="/home" className="font-serif text-xl text-raja-chrome-text tracking-wide">
        Raja
      </Link>
      <nav className="flex items-center gap-6">
        {links.map((link) => {
          const linkClass = link.pill
            ? 'font-sans-serif text-sm font-bold uppercase tracking-wide bg-raja-chrome-action text-raja-chrome-bg px-3 py-1.5 hover:opacity-90'
            : 'font-sans-serif text-sm text-raja-chrome-text hover:opacity-90';
          return (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.text}
            </Link>
          );
        })}
        {variant === 'protected' && (
          <button onClick={handleLogout} className="font-sans-serif text-sm text-raja-chrome-text hover:opacity-90">
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
