import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket<T = unknown>(
  resourceType: string,
  resourceId: string | number,
  onMessage: (data: T) => void,
  enabled: boolean = true,
) {
  const ws = useRef<WebSocket | null>(null);
  // Prevents the onclose handler from scheduling a reconnect when the
  // connection is closed intentionally (component unmount or enabled → false).
  const shouldReconnect = useRef(false);

  const connect = useCallback(() => {
    // Same-origin, through the /api rewrite (same path every other request uses) — the browser
    // attaches the session/testator cookie automatically, same as any other same-origin request.
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/${resourceType}/${resourceId}/ws`;
    ws.current = new WebSocket(wsUrl);

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
  }, [resourceType, resourceId, onMessage]);

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
