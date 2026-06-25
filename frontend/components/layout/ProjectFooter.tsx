import type { ReactNode } from 'react';

interface ProjectFooterProps {
  alt?: boolean;
  children: ReactNode;
  className?: string;
}

export default function ProjectFooter({ alt = false, children, className = '' }: ProjectFooterProps) {
  const bg = alt ? 'bg-project-black' : 'bg-project-white';

  return (
    <footer className={`${bg} ${className}`}>
      {children}
    </footer>
  );
}
