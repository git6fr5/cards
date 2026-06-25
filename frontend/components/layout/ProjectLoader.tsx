interface ProjectLoaderProps {
  alt?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProjectLoader({ alt = false, size = 'md', className = '' }: ProjectLoaderProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const track = alt ? 'border-project-white/20' : 'border-project-black/20';
  const indicator = alt ? 'border-t-project-white' : 'border-t-project-black';

  return (
    <div
      className={`rounded-full border-2 animate-spin ${sizeClass} ${track} ${indicator} ${className}`}
    />
  );
}
