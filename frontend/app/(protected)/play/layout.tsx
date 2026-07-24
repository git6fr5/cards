import type { ReactNode } from 'react';
import RajaRequirePlayer from '@/components/layout/RajaRequirePlayer';

export default function PlayLayout({ children }: { children: ReactNode }) {
  return <RajaRequirePlayer>{children}</RajaRequirePlayer>;
}
