// Centralised HTTP client for the backend.
// Goes through the /api rewrite in next.config.ts so requests stay same-origin.
const BASE_URL = '/api';

export async function get<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
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

export async function postFormData(path: string, body: FormData): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }
  return response.blob();
}

export async function postForm<T = unknown>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function put<T = unknown>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`PUT ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function del<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`DELETE ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getWithTestatorSession<T = unknown>(path: string, sessionKey: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Testator-Session-Key': sessionKey },
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}
