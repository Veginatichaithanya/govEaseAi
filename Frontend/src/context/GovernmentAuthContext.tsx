import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  governmentAuth,
  type GovernmentOfficer,
  type GovernmentRole,
} from '../mock/governmentAuth';

interface GovernmentAuthContextType {
  officer: GovernmentOfficer | null;
  loading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; officer?: GovernmentOfficer; error?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: GovernmentRole) => boolean;
  isAuthorizedForService: (serviceId: string) => boolean;
}

const GovernmentAuthContext = createContext<GovernmentAuthContextType | undefined>(undefined);

export const GovernmentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [officer, setOfficer] = useState<GovernmentOfficer | null>(() =>
    governmentAuth.getCurrentOfficer()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await governmentAuth.login(email, password, rememberMe);
      if (result.success && result.officer) {
        setOfficer(result.officer);
        return { success: true, officer: result.officer };
      } else {
        const msg = result.error || 'Authentication failed.';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    governmentAuth.logout();
    setOfficer(null);
    setError(null);
  }, []);

  const isAuthenticated = useCallback(() => officer !== null, [officer]);

  const hasRole = useCallback(
    (role: GovernmentRole) => officer?.role === role,
    [officer]
  );

  const isAuthorizedForService = useCallback(
    (serviceId: string) => {
      if (!officer) return false;
      if (officer.role === 'SUPER_ADMIN') return true;
      return officer.serviceIds.includes(serviceId);
    },
    [officer]
  );

  return (
    <GovernmentAuthContext.Provider
      value={{
        officer,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        hasRole,
        isAuthorizedForService,
      }}
    >
      {children}
    </GovernmentAuthContext.Provider>
  );
};

export const useGovernmentAuth = (): GovernmentAuthContextType => {
  const ctx = useContext(GovernmentAuthContext);
  if (!ctx) {
    throw new Error('useGovernmentAuth must be used within a GovernmentAuthProvider');
  }
  return ctx;
};
