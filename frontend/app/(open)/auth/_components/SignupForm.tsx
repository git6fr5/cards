'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RajaTextField from '@/components/ui/RajaTextField';
import RajaButton from '@/components/ui/RajaButton';
import { post } from '@/utils/api';

interface SignupFormProps {
  onSwitch: () => void;
}

export default function SignupForm({ onSwitch }: SignupFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    setError(null);
    setIsLoading(true);
    try {
      await post('/users/signup', { email, password, display_name: displayName });
      await post('/sessions', { email, password });
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-raja-chrome-bg text-center tracking-wide">
        Create your account
      </h1>

      {error && (
        <p className="font-sans-serif text-sm text-center text-raja-chrome-error">{error}</p>
      )}

      <div className="flex flex-col gap-4">
        <RajaTextField
          alt
          id="display-name"
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          disabled={isLoading}
        />
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
          placeholder="Create a password"
          disabled={isLoading}
        />
      </div>

      <RajaButton
        variant="action"
        text={isLoading ? 'Creating Account…' : 'Create Account'}
        loading={isLoading}
        onClick={handleSignup}
        fullWidth
      />

      <p className="font-sans-serif text-sm text-center text-raja-chrome-bg/60">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-bold underline">
          Sign in
        </button>
      </p>
    </div>
  );
}
