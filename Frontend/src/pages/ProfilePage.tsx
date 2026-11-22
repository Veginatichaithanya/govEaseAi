import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { authService, type AuthUser } from '../mock/auth';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Building,
  ArrowRight
} from 'lucide-react';
import { applicationService } from '../mock/applicationService';

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authUser);
  const [appCount, setAppCount] = useState<number>(0);

  useEffect(() => {
    const user = authUser || authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const apps = applicationService.getApplicationsByUser(user.id);
      setAppCount(apps.length);
    }
  }, [authUser]);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Citizen Profile
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Manage your digital citizen identity and verified government portal profile.
        </p>

        {/* Profile Card */}
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2rem'
          }}
        >
          {/* Top Avatar Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '2rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1.85rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)'
              }}
            >
              {(currentUser?.fullName || currentUser?.name || 'C').charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {currentUser?.fullName || currentUser?.name || 'Citizen'}
                </h2>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  <CheckCircle2 size={13} /> Verified Citizen
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                Applicant ID: {currentUser?.applicantId || currentUser?.id || 'Pending'} • Active Verified Identity
              </p>
            </div>
          </div>

          {/* User Fields Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Full Legal Name
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <User size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser?.fullName || currentUser?.name || 'Citizen'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Registered Email
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <Mail size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser?.email || 'citizen@goveaseai.local'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Mobile Number
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <Phone size={16} color="var(--status-success)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser?.phone || '+91 91822 60869'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Portal Role
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <ShieldCheck size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Citizen Applicant
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Account Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-success)'
                  }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Prototype Profile
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Submissions Made
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <Building size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {appCount} Applications Registered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/applications" className="btn btn-primary">
            View My Applications <ArrowRight size={16} />
          </Link>
          <Link to="/settings" className="btn btn-secondary">
            Settings &amp; Preferences
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
