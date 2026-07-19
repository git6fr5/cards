'use client';

import { useEffect, useState } from 'react';
import BagTabs from '@/app/_components/BagTabs';
import BagTable from '@/app/_components/BagTable';
import RajaButton from '@/components/ui/RajaButton';
import type { Bag, PieceFull } from '@/app/_components/types';

interface AccountBagsProps {
  bags: Bag[];
  catalogByName: Map<string, PieceFull>;
  isLoading: boolean;
}

export default function AccountBags({ bags, catalogByName, isLoading }: AccountBagsProps) {
  const [selectedBagId, setSelectedBagId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedBagId === null && bags.length > 0) {
      setSelectedBagId(bags[0].id);
    }
  }, [bags, selectedBagId]);

  const selectedBag = bags.find((bag) => bag.id === selectedBagId) ?? null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-raja-chrome-text tracking-wide">Your Bags</h2>
        {selectedBag && (
          <RajaButton
            variant="link"
            href={`/catalog?bagId=${selectedBag.id}`}
            text="Edit Bag"
            alt
          />
        )}
      </div>
      <div className="flex flex-col border border-raja-chrome-border h-96">
        <BagTabs bags={bags} selectedBagId={selectedBagId} onSelect={setSelectedBagId} readOnly />
        <BagTable bag={selectedBag} catalogByName={catalogByName} isLoading={isLoading} dragSource={null} readOnly />
      </div>
    </section>
  );
}
