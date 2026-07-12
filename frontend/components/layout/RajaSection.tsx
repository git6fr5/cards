import type { ReactNode } from 'react';

interface RajaSectionProps {
  alt?: boolean;
  children: ReactNode;
  className?: string;
}

export default function RajaSection({ alt = false, children, className = '' }: RajaSectionProps) {
  const bg = alt ? 'bg-raja-chrome-text' : 'bg-raja-chrome-bg';

  return (
    <section className={`w-full ${bg} ${className}`}>
      {children}
    </section>
  );
}
