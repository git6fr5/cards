'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface TabGroupProps {
  tabs: { label: string; content: ReactNode }[];
}

export default function TabGroup({ tabs }: TabGroupProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1 border-b border-raja-chrome-border">
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const tabClass = isActive
            ? 'border-b-2 border-raja-chrome-action text-raja-chrome-text'
            : 'border-b-2 border-transparent text-raja-chrome-muted hover:text-raja-chrome-text';
          return (
            <button
              key={tab.label}
              onClick={() => setActiveIndex(i)}
              className={`font-sans-serif px-3 py-1.5 text-xs uppercase tracking-wide ${tabClass}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab.content}
    </div>
  );
}
