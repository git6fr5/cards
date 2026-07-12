import type { ReactNode } from 'react';

interface RajaFooterProps {
  alt?: boolean;
  children: ReactNode;
  className?: string;
}

export default function RajaFooter({ alt = false, children, className = '' }: RajaFooterProps) {
  const bg = alt ? 'bg-raja-chrome-text' : 'bg-raja-chrome-bg';

  return (
    <footer className={`${bg} ${className}`}>
      {children}
    </footer>
  );
}
