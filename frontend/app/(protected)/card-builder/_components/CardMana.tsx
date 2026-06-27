interface CardManaProps {
  value: number;
}

export default function CardMana({ value }: CardManaProps) {
  return (
    <div className="flex h-[8mm] w-[8mm] items-center justify-center rounded-full border border-kingkiller-gold/30 bg-kingkiller-arcane">
      <span className="font-garamond text-xs font-bold text-kingkiller-white">{value}</span>
    </div>
  );
}
