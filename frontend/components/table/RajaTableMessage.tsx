import RajaLoader from '@/components/layout/RajaLoader';

interface RajaTableMessageProps {
  loading?: boolean;
  text?: string;
  muted?: boolean;
  className?: string;
}

export default function RajaTableMessage({ loading = false, text, muted = false, className = '' }: RajaTableMessageProps) {
  const color = muted ? 'text-raja-chrome-muted' : 'text-raja-chrome-text';

  return (
    <div className={`flex items-center justify-center gap-2 py-8 ${className}`}>
      {loading && <RajaLoader size="sm" />}
      {text && <p className={`font-sans-serif text-sm ${color}`}>{text}</p>}
    </div>
  );
}
