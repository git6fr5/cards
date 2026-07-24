'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { checkSession, type CurrentUser } from '@/utils/auth';

interface CurrentUserProviderProps {
  children: ReactNode;
}

interface CurrentUserContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession().then((sessionUser) => {
      setUser(sessionUser);
      setIsLoading(false);
    });
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, isLoading }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
}
