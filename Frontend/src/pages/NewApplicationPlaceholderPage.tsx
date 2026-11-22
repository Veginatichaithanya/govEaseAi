import React from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_SERVICES } from '../mock/services';
import {
  ArrowLeft,
  Clock,
  ArrowRight,
  FileEdit,
  Building
} from 'lucide-react';

export const NewApplicationPlaceholderPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();

  const service = MOCK_SERVICES.find((s) => s.id === serviceId);
  const serviceName = service ? service.name : 'Government Service';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          {/* Back to Service Link */}
          <Link
            to={service ? `/services/${service.id}` : '/services'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#94A3B8',
              fontSize: '0.88rem',
              marginBottom: '2rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} /> Back to {serviceName}
          </Link>

          {/* Placeholder Card */}
          <div
            className="glass-panel"
            style={{
              padding: '3.5rem 2.5rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(12, 28, 52, 0.95) 0%, rgba(7, 18, 33, 0.95) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
                marginBottom: '1.5rem'
              }}
            >
              <FileEdit size={32} />
            </div>

            <div
              className="section-eyebrow"
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: '#60A5FA',
                marginBottom: '1rem'
              }}
            >
              <Clock size={12} />
              UPCOMING DEVELOPMENT PHASE
            </div>

            <h1 style={{ fontSize: 'clamp(1.85rem, 4vw, 2.5rem)', color: '#FFFFFF', marginBottom: '1rem' }}>
              {serviceName} Application
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                color: '#CBD5E1',
                lineHeight: 1.6,
                maxWidth: '560px',
                margin: '0 auto 2.5rem auto'
              }}
            >
              Application form will be implemented in the next development phase.
            </p>

            <div
              style={{
                padding: '1.15rem 1.5rem',
                background: 'rgba(15, 31, 53, 0.55)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 'var(--radius-md)',
                maxWidth: '520px',
                margin: '0 auto 2.5rem auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                textAlign: 'left'
              }}
            >
              <Building size={20} color="#60A5FA" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', display: 'block' }}>
                  Target Route: /applications/new/{serviceId || 'unknown'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Service context preserved. Document ingestion and AI pre-validation form will mount here.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to={service ? `/services/${service.id}` : '/services'}
                className="btn btn-primary"
                style={{ padding: '0.8rem 1.75rem' }}
              >
                <ArrowLeft size={16} /> Back to Service
              </Link>
              <Link
                to="/services"
                className="btn btn-secondary"
                style={{ padding: '0.8rem 1.5rem' }}
              >
                Browse All Services <ArrowRight size={16} />
              </Link>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
};

export default NewApplicationPlaceholderPage;
