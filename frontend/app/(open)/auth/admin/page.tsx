'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/utils/api';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminBypass() {
  const router = useRouter();

  const [status, setStatus] = useState('Signing in…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      setError('Admin bypass is only available on localhost.');
      return;
    }
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      setError('Set NEXT_PUBLIC_ADMIN_EMAIL and NEXT_PUBLIC_ADMIN_PASSWORD in .env.local.');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect') ?? '/account';

    const login = async () => {
      try {
        await post('/sessions', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        setStatus('Signed in. Redirecting…');
        router.replace(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Admin sign-in failed.');
      }
    };

    login();
  }, [router]);

  return (
    <div className="font-sans-serif p-8 text-center max-w-sm mx-auto">
      {error ? (
        <p className="text-xs text-red-600 break-words">⚠ {error}</p>
      ) : (
        <p className="text-sm text-gray-700">{status}</p>
      )}
    </div>
  );
}
