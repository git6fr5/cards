interface TurnStatusProps {
  turnCount: number;
  activePlayerIndex: number;
  lastOutcome?: string;
}

export default function TurnStatus({ turnCount, activePlayerIndex, lastOutcome }: TurnStatusProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-sans-serif text-xs uppercase tracking-wide text-raja-chrome-muted">
        Turn {turnCount} — Player {activePlayerIndex}&apos;s move
      </span>
      {lastOutcome && (
        <p className="font-sans-serif text-xs text-raja-chrome-muted">{lastOutcome}</p>
      )}
    </div>
  );
}
