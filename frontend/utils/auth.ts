import { get, del } from '@/utils/api';

// Mirrors backend/utils/auth.py:SESSION_COOKIE_NAME — the edge proxy (proxy.ts, middleware,
// server-side only) reads this name (not value; it's HttpOnly) to gate protected routes before
// render. No NEXT_PUBLIC_ prefix: middleware never ships this into the client bundle.
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME as string;

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
