import { useCallback, useRef, useState } from 'react';

export interface ToastItem {
  text: string;
  tone: 'success' | 'error';
}

interface QueuedToast extends ToastItem {
  id: number;
}

export function useToastQueue() {
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((item: ToastItem) => {
    nextId.current += 1;
    setQueue((prev) => [...prev, { ...item, id: nextId.current }]);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return { active: queue[0] ?? null, push, dismiss };
}
