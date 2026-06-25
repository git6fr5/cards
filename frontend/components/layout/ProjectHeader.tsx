interface ProjectHeaderProps {
  alt?: boolean;
  text: string;
  em?: string;
  className?: string;
}

export default function ProjectHeader({ alt = false, text, em, className = '' }: ProjectHeaderProps) {
  const color = alt ? 'text-project-white' : 'text-project-black';

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
