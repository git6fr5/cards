'use client';

import { useState } from 'react';
import RajaSection from '@/components/layout/RajaSection';
import LoginForm from './_components/LoginForm';
import SignupForm from './_components/SignupForm';

type Mode = 'login' | 'signup';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');

  return (
    <RajaSection alt className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {mode === 'login'
          ? <LoginForm onSwitch={() => setMode('signup')} />
          : <SignupForm onSwitch={() => setMode('login')} />
        }
      </div>
    </RajaSection>
  );
}
