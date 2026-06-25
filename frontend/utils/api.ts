// Centralised HTTP client for the backend.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function get<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
* Use when fetching data directly into a state setter with no transformation —
* handles try/catch and error logging. For fetches requiring transformation,
* use get() directly.
*/
export async function fetchData<T, R = T>(
  setter: (data: R) => void,
  path: string,
  transform?: (raw: T) => R,
): Promise<void> {
  try {
    const raw = await get<T>(path);
    setter(transform ? transform(raw) : raw as unknown as R);
  } catch (err) {
    console.error(`Error fetching from ${path}:`, err);
  }
}

export async function put<T = unknown>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`PUT ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function del<T = unknown>(path: string): Promise<T | undefined> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`DELETE ${path} failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined;
  return response.json() as Promise<T>;
}
