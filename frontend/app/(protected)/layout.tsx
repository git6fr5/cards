import type { ReactNode } from 'react';
import RajaHeader from '@/components/layout/RajaHeader';
import RajaFooter from '@/components/layout/RajaFooter';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RajaHeader variant="protected" />
      {children}
      <RajaFooter>
        <div className="flex items-center justify-between px-6 py-4 text-sm text-raja-chrome-text">
          <span className="font-garamond">Raja</span>
          <span>© 2026</span>
        </div>
      </RajaFooter>
    </>
  );
}
