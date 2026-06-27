interface CardMovementProps {
  symbol: string;
}

export default function CardMovement({ symbol }: CardMovementProps) {
  return (
    <div className="flex h-[8mm] w-[8mm] items-center justify-center rounded-full border border-kingkiller-gold/30 bg-kingkiller-emerald">
      <span className="font-garamond text-xs text-kingkiller-white">{symbol}</span>
    </div>
  );
}
