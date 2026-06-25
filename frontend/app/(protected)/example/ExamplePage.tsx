'use client';

import { useState, useEffect } from 'react';
import { get } from '@/utils/api';
import ProjectLoader from '@/components/layout/ProjectLoader';
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
    <div className="min-h-screen bg-project-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center gap-4 py-8">
          <AnimatedExampleText />
          <p className="text-sm text-project-grey font-garamond">
            This is an example page demonstrating the template structure.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-garamond text-project-black mb-4 border-b border-project-grey-light pb-2">
            Example Items
          </h2>

          {isLoading && (
            <div className="flex justify-center py-8">
              <ProjectLoader />
            </div>
          )}

          {error && !isLoading && (
            <p className="text-sm text-project-red">{error}</p>
          )}

          {!isLoading && !error && items.length === 0 && (
            <p className="text-sm text-project-grey">No example items found.</p>
          )}

          {!isLoading && !error && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-project-hover rounded-sm"
                >
                  <span className="text-base font-garamond text-project-black">{item.name}</span>
                  {item.description && (
                    <span className="text-sm text-project-grey font-garamond">{item.description}</span>
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
