'use client';
import Link from 'next/link';
import ProjectLoader from '@/components/layout/ProjectLoader';

interface ProjectButtonProps {
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

export default function ProjectButton(props: ProjectButtonProps) {
  const { alt = false, text, fullWidth = false, disabled = false, loading = false, className = '' } = props;

  const bg    = alt ? 'bg-project-white' : 'bg-project-black';
  const color = alt ? 'text-project-black' : 'text-project-white';
  const hover = alt ? 'hover:bg-project-grey-light' : 'hover:bg-project-grey';
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
          <ProjectLoader size="sm" alt={!alt} />
        </span>
      )}
    </button>
  );
}
