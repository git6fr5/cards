interface CardNameProps {
  name: string;
}

export default function CardName({ name }: CardNameProps) {
  return (
    <div className="shrink-0 border-y border-kingkiller-gold/40 bg-kingkiller-black/50 px-[3mm] py-[1.5mm]">
      <span className="block truncate font-garamond text-sm font-bold text-kingkiller-gold">{name}</span>
    </div>
  );
}
