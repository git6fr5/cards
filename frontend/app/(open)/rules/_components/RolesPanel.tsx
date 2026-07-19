import RajaSection from '@/components/layout/RajaSection';

const ROLES = [
  { name: 'Unit', description: 'A Unit moves according to its own pattern and can capture any enemy piece it reaches.' },
  { name: 'Building', description: 'A Building never moves. Activating it fires its ability at a target on an adjacent square instead.' },
  { name: 'King', description: 'The King moves like any other piece and also defines where your army may be summoned. If it dies, you lose. Its own ability fires whenever any piece in your army triggers one.' },
];

export default function RolesPanel() {
  return (
    <RajaSection className="flex h-full flex-col gap-3 border border-raja-chrome-border p-6">
      <h2 className="font-serif text-xl font-bold text-raja-chrome-text">Piece Roles</h2>
      <ol className="flex list-none flex-col gap-3">
        {ROLES.map((role, i) => (
          <li key={role.name} className="flex gap-3">
            <span className="font-monospace text-sm text-raja-chrome-action">{i + 1}.</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{role.name}</span>
              <p className="font-sans-serif text-sm text-raja-chrome-text">{role.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </RajaSection>
  );
}
