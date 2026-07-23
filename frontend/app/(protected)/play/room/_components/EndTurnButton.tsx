import RajaButton from '@/components/ui/RajaButton';

interface EndTurnButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function EndTurnButton({ onClick, disabled, loading }: EndTurnButtonProps) {
  return <RajaButton variant="action" text="End Turn" onClick={onClick} disabled={disabled} loading={loading} />;
}
