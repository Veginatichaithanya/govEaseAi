import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../services/apiClient';

interface CitizenProtectedRouteProps {
  children: React.ReactNode;
}

export const CitizenProtectedRoute: React.FC<CitizenProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const token = getAuthToken();

  // If auth state is still resolving and a token exists in storage, show clean branded loading state
  if (loading && token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary, #0B1120)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1.25rem',
          padding: '2rem'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid var(--accent-blue, #2563EB)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em'
          }}
        >
          Verifying citizen session...
        </div>
      </div>
    );
  }

  // If not loading and no authenticated user or no token exists, redirect to login
  if (!loading && (!currentUser || !token)) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // If no token exists at all
  if (!token && !currentUser) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default CitizenProtectedRoute;
