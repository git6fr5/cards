interface RajaLoaderProps {
  alt?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RajaLoader({ alt = false, size = 'md', className = '' }: RajaLoaderProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const track = alt ? 'border-raja-chrome-bg/20' : 'border-raja-chrome-text/20';
  const indicator = alt ? 'border-t-raja-chrome-bg' : 'border-t-raja-chrome-text';

  return (
    <div
      className={`rounded-full border-2 animate-spin ${sizeClass} ${track} ${indicator} ${className}`}
    />
  );
}
