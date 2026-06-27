'use client';

import { useState, useEffect } from 'react';
import { get } from '@/utils/api';
import KingkillerLoader from '@/components/layout/KingkillerLoader';
import AnimatedExampleText from './_components/AnimatedExampleText';

interface ExampleItem {
  id: number;
  name: string;
  description: string | null;
  is_archived: boolean;
}

export default function ExamplePage() {
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await get<ExampleItem[]>('/example-items/');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="min-h-screen bg-kingkiller-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center gap-4 py-8">
          <AnimatedExampleText />
          <p className="text-sm text-kingkiller-grey font-garamond">
            This is an example page demonstrating the template structure.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-garamond text-kingkiller-black mb-4 border-b border-kingkiller-grey-light pb-2">
            Example Items
          </h2>

          {isLoading && (
            <div className="flex justify-center py-8">
              <KingkillerLoader />
            </div>
          )}

          {error && !isLoading && (
            <p className="text-sm text-kingkiller-crimson">{error}</p>
          )}

          {!isLoading && !error && items.length === 0 && (
            <p className="text-sm text-kingkiller-grey">No example items found.</p>
          )}

          {!isLoading && !error && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-kingkiller-hover rounded-sm"
                >
                  <span className="text-base font-garamond text-kingkiller-black">{item.name}</span>
                  {item.description && (
                    <span className="text-sm text-kingkiller-grey font-garamond">{item.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
