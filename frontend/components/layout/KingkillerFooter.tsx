import type { ReactNode } from 'react';

interface KingkillerFooterProps {
  alt?: boolean;
  children: ReactNode;
  className?: string;
}

export default function KingkillerFooter({ alt = false, children, className = '' }: KingkillerFooterProps) {
  const bg = alt ? 'bg-kingkiller-black' : 'bg-kingkiller-white';

  return (
    <footer className={`${bg} ${className}`}>
      {children}
    </footer>
  );
}
