interface RajaHeaderProps {
  alt?: boolean;
  text: string;
  em?: string;
  className?: string;
}

export default function RajaHeader({ alt = false, text, em, className = '' }: RajaHeaderProps) {
  const color = alt ? 'text-raja-chrome-bg' : 'text-raja-chrome-text';

  if (!em) {
    return <h2 className={`text-xl font-bold ${color} ${className}`}>{text}</h2>;
  }

  const [before, after] = text.split(em);
  return (
    <h2 className={`text-xl font-bold ${color} ${className}`}>
      {before}<em>{em}</em>{after}
    </h2>
  );
}
