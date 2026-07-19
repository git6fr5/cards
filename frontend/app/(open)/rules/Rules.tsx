import OverviewPanel from './_components/OverviewPanel';
import MovementsPanel from './_components/MovementsPanel';
import AbilitiesPanel from './_components/AbilitiesPanel';
import ZonesPanel from './_components/ZonesPanel';
import RolesPanel from './_components/RolesPanel';

export default function Rules() {
  return (
    <main className="flex flex-col gap-3 bg-raja-chrome-panel p-3">
      <OverviewPanel />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-3">
        <ZonesPanel />
        <MovementsPanel />
        <RolesPanel />
      </div>
      <AbilitiesPanel />
    </main>
  );
}
