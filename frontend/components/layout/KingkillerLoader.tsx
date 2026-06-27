interface KingkillerLoaderProps {
  alt?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function KingkillerLoader({ alt = false, size = 'md', className = '' }: KingkillerLoaderProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const track = alt ? 'border-kingkiller-white/20' : 'border-kingkiller-black/20';
  const indicator = alt ? 'border-t-kingkiller-white' : 'border-t-kingkiller-black';

  return (
    <div
      className={`rounded-full border-2 animate-spin ${sizeClass} ${track} ${indicator} ${className}`}
    />
  );
}
