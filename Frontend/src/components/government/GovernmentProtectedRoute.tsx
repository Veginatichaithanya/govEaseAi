import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGovernmentAuth } from '../../context/GovernmentAuthContext';
import type { GovernmentRole } from '../../mock/governmentAuth';
import { ShieldOff, ArrowLeft } from 'lucide-react';

interface GovernmentProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only officers with this role can access. Omit to allow any authenticated officer. */
  requiredRole?: GovernmentRole;
}

const AccessDenied: React.FC<{ requiredRole?: GovernmentRole; officerRole?: string }> = ({
  requiredRole,
  officerRole,
}) => (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '2rem',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: '72px',
        height: '72px',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
      }}
    >
      <ShieldOff size={36} color="#fff" />
    </div>

    <div>
      <h1
        style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}
      >
        Access Denied
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px' }}>
        {requiredRole
          ? `This page requires the ${requiredRole.replace(/_/g, ' ')} role. Your current role (${officerRole?.replace(/_/g, ' ')}) does not have access.`
          : 'You do not have permission to access this page.'}
      </p>
    </div>

    <a
      href="/government/login"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--accent-blue)',
        fontSize: '0.9rem',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      <ArrowLeft size={16} />
      Return to Government Portal Login
    </a>
  </div>
);

export const GovernmentProtectedRoute: React.FC<GovernmentProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { officer } = useGovernmentAuth();
  const location = useLocation();

  if (!officer) {
    return (
      <Navigate
        to="/government/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (requiredRole && officer.role !== requiredRole && officer.role !== 'SUPER_ADMIN') {
    return <AccessDenied requiredRole={requiredRole} officerRole={officer.role} />;
  }

  return <>{children}</>;
};

export default GovernmentProtectedRoute;
