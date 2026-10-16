import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cognitoService, isCognitoConfigured } from '../services/cognito';
import { UserProfile } from '../types/memory';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCognitoLive: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ userConfirmed: boolean }>;
  confirmSignup: (email: string, code: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session on mount
  useEffect(() => {
    const session = cognitoService.getStoredSession();
    if (session.user && session.token) {
      setUser(session.user);
      setToken(session.token);
    }
    setIsLoading(false);

    // Listen for unauthorized events from API layer
    const handleUnauthorized = () => {
      cognitoService.signOut();
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await cognitoService.signIn(email, password);
      setUser(result.user);
      setToken(result.accessToken);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await cognitoService.signUp(email, password, name);
      return { userConfirmed: result.userConfirmed };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmSignup = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    try {
      return await cognitoService.confirmSignUp(email, code);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return cognitoService.forgotPassword(email);
  }, []);

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      return cognitoService.confirmForgotPassword(email, code, newPassword);
    },
    []
  );

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
        isCognitoLive: isCognitoConfigured,
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
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

