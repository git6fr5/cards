interface GameLogPanelProps {
  log: string[];
}

export default function GameLogPanel({ log }: GameLogPanelProps) {
  return (
    <div className="flex flex-col gap-1 w-full h-full overflow-y-auto">
      <span className="font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">
        Game Log
      </span>
      {log.length === 0 && (
        <p className="font-sans-serif text-xs text-raja-chrome-muted">No moves yet</p>
      )}
      {log.map((entry, i) => (
        <p key={i} className="font-sans-serif text-xs text-raja-chrome-text">
          {i + 1}. {entry}
        </p>
      ))}
    </div>
  );
}
