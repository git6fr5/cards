import type { ReactNode } from 'react';

interface ProjectSectionProps {
  alt?: boolean;
  children: ReactNode;
  className?: string;
}

export default function ProjectSection({ alt = false, children, className = '' }: ProjectSectionProps) {
  const bg = alt ? 'bg-project-black' : 'bg-project-white';

  return (
    <section className={`w-full ${bg} ${className}`}>
      {children}
    </section>
  );
}
