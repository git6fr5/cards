interface GameLogPanelProps {
  log: string[];
}

export default function GameLogPanel({ log }: GameLogPanelProps) {
  return (
    <div className="hidden lg:flex flex-col w-64 max-h-[80vh] overflow-y-auto gap-1 border-l border-kingkiller-stone/40 pl-4">
      <span className="font-garamond text-xs uppercase tracking-wide text-kingkiller-grey-muted">
        Game Log
      </span>
      {log.length === 0 && (
        <p className="font-garamond text-xs text-kingkiller-grey-muted">No moves yet</p>
      )}
      {log.map((entry, i) => (
        <p key={i} className="font-garamond text-xs text-kingkiller-grey-light">
          {i + 1}. {entry}
        </p>
      ))}
    </div>
  );
}
