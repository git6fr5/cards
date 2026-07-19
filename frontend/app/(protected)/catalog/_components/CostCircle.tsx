interface CostCircleProps {
  value: number;
  label: string;
  bgClassName?: string;
}

export default function CostCircle({ value, label, bgClassName = 'bg-raja-chrome-bg' }: CostCircleProps) {
  return (
    <div
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-full border border-raja-chrome-border font-monospace text-xs text-raja-chrome-text ${bgClassName}`}
    >
      {value}
    </div>
  );
}
