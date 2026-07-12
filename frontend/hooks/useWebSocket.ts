import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket<T = unknown>(
  testamentId: number,
  onMessage: (data: T) => void,
  enabled: boolean = true,
) {
  const ws = useRef<WebSocket | null>(null);
  // Prevents the onclose handler from scheduling a reconnect when the
  // connection is closed intentionally (component unmount or enabled → false).
  const shouldReconnect = useRef(false);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws');
    ws.current = new WebSocket(`${wsUrl}/testaments/ws/${testamentId}`);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data) as T;
      onMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      if (shouldReconnect.current) {
        setTimeout(connect, 3000);
      }
    };
  }, [testamentId, onMessage]);

  useEffect(() => {
    if (!enabled) return;

    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect, enabled]);

  return ws;
}
