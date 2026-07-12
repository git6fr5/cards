import { get, del } from '@/utils/api';

// Mirrors backend/utils/auth.py:SESSION_COOKIE_NAME — the edge proxy reads this
// name (not value; it's HttpOnly) to gate protected routes before render.
export const SESSION_COOKIE_NAME = 'kellon_session';

export const TESTATOR_SESSION_KEY = 'kellon_testator_session';

export interface CurrentUser {
  id: number;
  email: string;
  display_name: string;
  permission_level: string;
  is_archived: boolean;
  organisation_id: number;
}

// The session lives in an HttpOnly cookie the browser manages automatically —
// there is nothing for client JS to store or read. "Am I logged in" is
// answered by asking the server.
//
// Call this in a useEffect on mount of any protected page to guard against
// unauthenticated access:
//
//   useEffect(() => {
//     checkSession().then((user) => {
//       if (!user) router.replace('/auth');
//     });
//   }, []);
export async function checkSession(): Promise<CurrentUser | null> {
  try {
    return await get<CurrentUser>('/users/me');
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await del('/sessions');
  } catch {
    // Best-effort: the server clears the cookie on its response regardless.
  }
}

// ---------------------------------------------------------------------------
// Testator session — stored in sessionStorage, cleared when the tab closes.
// ---------------------------------------------------------------------------

export interface TestatorSession {
  testament_id: number;
  session_key: string;
}

/** Persist a testator session to sessionStorage after invite redemption. */
export function saveTestatorSession(session: TestatorSession): void {
  sessionStorage.setItem(TESTATOR_SESSION_KEY, JSON.stringify(session));
}

/**
 * Read the current testator session from sessionStorage.
 * Returns null if there is no session, if the stored value is malformed,
 * or if called during SSR.
 */
export function getTestatorSession(): TestatorSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(TESTATOR_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TestatorSession;
  } catch {
    return null;
  }
}
