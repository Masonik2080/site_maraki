// components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthClientService, type AuthUser } from '@/lib/services/auth.client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const currentUser = await AuthClientService.getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    // Initial load
    refresh().finally(() => setLoading(false));

    // Subscribe to auth changes
    const unsubscribe = AuthClientService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
