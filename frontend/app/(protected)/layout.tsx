import type { ReactNode } from 'react';
import RajaHeader from '@/components/layout/RajaHeader';
import RajaFooter from '@/components/layout/RajaFooter';
import { CurrentUserProvider } from '@/hooks/useCurrentUser';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <RajaHeader showCatalog />
      <main className="flex-1">{children}</main>
      <RajaFooter>
        <div className="flex items-center justify-between px-6 py-4 text-sm text-raja-chrome-text">
          <span className="font-serif">Raja</span>
          <span className="font-sans-serif">© 2026</span>
        </div>
      </RajaFooter>
    </CurrentUserProvider>
  );
}
