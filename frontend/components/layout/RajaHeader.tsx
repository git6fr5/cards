interface KingkillerHeaderProps {
  alt?: boolean;
  text: string;
  em?: string;
  className?: string;
}

export default function KingkillerHeader({ alt = false, text, em, className = '' }: KingkillerHeaderProps) {
  const color = alt ? 'text-kingkiller-white' : 'text-kingkiller-black';

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
