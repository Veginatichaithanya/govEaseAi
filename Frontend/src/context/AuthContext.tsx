import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, type AuthUser } from '../mock/auth';
import { getAuthToken, clearAuthToken, apiRequest } from '../services/apiClient';

interface AuthContextType {
  currentUser: AuthUser | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signup: (
    fullName: string,
    email: string,
    mobile: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; user?: AuthUser; message?: string; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocally: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(() => {
    const token = getAuthToken();
    const cachedUser = authService.getCurrentUser();
    return !(token && cachedUser);
  });
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      clearAuthToken();
      localStorage.removeItem('govease_auth_user');
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<any>('/auth/me');
      if (res.ok && res.data) {
        const u = res.data;
        const realName = u.fullName || u.full_name || u.name;
        const normalized: AuthUser = {
          id: u.id,
          name: realName,
          fullName: realName,
          email: u.email,
          mobile: u.phone || u.mobile,
          phone: u.phone || u.mobile,
          role: (u.role?.toLowerCase() as 'citizen' | 'officer') || 'citizen',
          applicantId: u.applicantId || u.applicant_id || undefined,
          profileCompletion: u.profileCompletion ?? 45,
          department: u.departmentName,
          departmentId: u.departmentId,
          officerTitle: u.officerTitle
        };
        setCurrentUser(normalized);
        localStorage.setItem('govease_auth_user', JSON.stringify(normalized));
      } else if (res.status === 401 || res.status === 403) {
        // Token invalid, expired or account deactivated
        clearAuthToken();
        localStorage.removeItem('govease_auth_user');
        setCurrentUser(null);
      } else {
        // Non-auth error (e.g. 500, network glitch): DO NOT log user out! Keep cached credentials.
        console.warn('Backend /auth/me returned non-auth status:', res.status);
      }
    } catch (err) {
      console.warn('Could not refresh authenticated user from backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener('govease_auth_change', handleAuthChange);
    return () => window.removeEventListener('govease_auth_change', handleAuthChange);
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.loginAsync(email, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setLoading(false);
        return { success: true, user: res.user };
      } else {
        setError(res.error || 'Invalid credentials');
        setLoading(false);
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const signup = async (
    fullName: string,
    email: string,
    mobile: string,
    password: string,
    confirmPassword: string
  ) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.signupAsync(fullName, email, mobile, password, confirmPassword);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setLoading(false);
        return { success: true, user: res.user, message: res.message };
      } else {
        setError(res.error || 'Registration failed');
        setLoading(false);
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const updateUserLocally = (partial: Partial<AuthUser>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem('govease_auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        loading,
        error,
        login,
        signup,
        logout,
        refreshUser,
        updateUserLocally
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
