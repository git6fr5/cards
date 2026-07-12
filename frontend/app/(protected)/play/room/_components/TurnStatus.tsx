interface TurnStatusProps {
  turnCount: number;
  activePlayerIndex: number;
  lastOutcome?: string;
}

export default function TurnStatus({ turnCount, activePlayerIndex, lastOutcome }: TurnStatusProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-garamond text-xs uppercase tracking-wide text-raja-grey-muted">
        Turn {turnCount} — Player {activePlayerIndex}&apos;s move
      </span>
      {lastOutcome && (
        <p className="font-garamond text-xs text-raja-grey-muted">{lastOutcome}</p>
      )}
    </div>
  );
}
