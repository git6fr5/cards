import RajaButton from '@/components/ui/RajaButton';

interface EndTurnButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function EndTurnButton({ onClick, disabled, loading, fullWidth }: EndTurnButtonProps) {
  return <RajaButton variant="action" text="End Turn" onClick={onClick} disabled={disabled} loading={loading} fullWidth={fullWidth} />;
}
