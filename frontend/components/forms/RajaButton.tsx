'use client';
import Link from 'next/link';
import RajaLoader from '@/components/layout/RajaLoader';

interface RajaButtonProps {
  alt?: boolean;
  text: string;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: 'link' | 'action';
  href?: string;
  target?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export default function RajaButton(props: RajaButtonProps) {
  const { alt = false, text, fullWidth = false, disabled = false, loading = false, className = '' } = props;

  const bg    = alt ? 'bg-raja-chrome-panel' : 'bg-raja-chrome-action';
  const color = alt ? 'text-raja-chrome-text' : 'text-raja-chrome-bg';
  const hover = alt ? 'hover:bg-raja-chrome-border' : 'hover:opacity-90';
  const width = fullWidth ? 'w-full' : '';

  const base = `relative ${bg} ${color} ${hover} ${width} px-4 py-2 text-sm font-medium disabled:opacity-disabled disabled:cursor-not-allowed ${className}`.trim();

  if (props.variant === 'link') {
    return (
      <Link href={props.href ?? '#'} target={props.target} className={base}>
        {text}
      </Link>
    );
  }

  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} disabled={disabled || loading} className={base}>
      <span className={loading ? 'invisible' : ''}>{text}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <RajaLoader size="sm" alt={!alt} />
        </span>
      )}
    </button>
  );
}
