import type { ReactNode } from 'react';

interface KingkillerSectionProps {
  alt?: boolean;
  children: ReactNode;
  className?: string;
}

export default function KingkillerSection({ alt = false, children, className = '' }: KingkillerSectionProps) {
  const bg = alt ? 'bg-kingkiller-black' : 'bg-kingkiller-white';

  return (
    <section className={`w-full ${bg} ${className}`}>
      {children}
    </section>
  );
}
