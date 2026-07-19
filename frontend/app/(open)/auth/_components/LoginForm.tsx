'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RajaTextField from '@/components/ui/RajaTextField';
import RajaButton from '@/components/ui/RajaButton';
import { post } from '@/utils/api';

interface LoginFormProps {
  onSwitch: () => void;
}

export default function LoginForm({ onSwitch }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    setIsLoading(true);
    try {
      await post('/sessions', { email, password });
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') ?? '/account';
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-raja-chrome-bg text-center tracking-wide">
        Sign in to Raja
      </h1>

      {error && (
        <p className="font-sans-serif text-sm text-center text-raja-chrome-error">{error}</p>
      )}

      <div className="flex flex-col gap-4">
        <RajaTextField
          alt
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isLoading}
        />
        <RajaTextField
          alt
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
        />
      </div>

      <RajaButton
        variant="action"
        text={isLoading ? 'Signing in…' : 'Sign In'}
        loading={isLoading}
        onClick={handleLogin}
        fullWidth
      />

      <p className="font-sans-serif text-sm text-center text-raja-chrome-bg/60">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-bold underline">
          Create one
        </button>
      </p>
    </div>
  );
}
