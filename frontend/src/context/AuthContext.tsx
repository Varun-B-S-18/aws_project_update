import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cognitoService } from '../services/cognito';
import { UserProfile } from '../types/memory';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCognitoLive: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ userConfirmed: boolean; userSub: string }>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    isMounted.current = true;
    const { user: storedUser, token: storedToken } = cognitoService.getStoredSession();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setIsLoading(false);

    // Listen for 401 unauthorized events dispatched by api.ts
    const handleUnauthorized = () => {
      if (isMounted.current) {
        cognitoService.signOut();
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted.current = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await cognitoService.signIn(email, password);
    if (isMounted.current) {
      setUser(result.user);
      setToken(result.accessToken);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    return cognitoService.signUp(email, password, name);
  }, []);

  const confirmSignup = useCallback(async (email: string, code: string) => {
    await cognitoService.confirmSignUp(email, code);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await cognitoService.forgotPassword(email);
  }, []);

  const confirmForgotPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await cognitoService.confirmForgotPassword(email, code, newPassword);
  }, []);

  const logout = useCallback(() => {
    cognitoService.signOut();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isCognitoLive: cognitoService.isConfigured(),
        login,
        signup,
        confirmSignup,
        forgotPassword,
        confirmForgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

