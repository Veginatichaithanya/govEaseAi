import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building
} from 'lucide-react';
import type { ApplicationRecord } from '../../mock/applicationService';
import type { GovernmentService } from '../../mock/services';

export interface WizardStep {
  num: number;
  name: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { num: 1, name: 'Applicant Info' },
  { num: 2, name: 'Business Info' },
  { num: 3, name: 'App. Details' },
  { num: 4, name: 'Documents' },
  { num: 5, name: 'AI Verify' },
  { num: 6, name: 'Review & Submit' }
];

interface WizardLayoutProps {
  service: GovernmentService;
  application: ApplicationRecord;
  currentStep: number;
  successMessage?: string | null;
  errorMessage?: string | null;
  children: React.ReactNode;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
  service,
  application,
  currentStep,
  successMessage,
  errorMessage,
  children
}) => {
  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', paddingBottom: '90px' }}>

        {/* Back to Service Details Navigation */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to={`/services/${service.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              fontSize: '0.86rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              textDecoration: 'none',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid transparent',
              transition: 'all 0.18s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            }}
          >
            <ArrowLeft size={15} /> Back to Service Details
          </Link>
        </div>

        {/* Compact Application Header Card with High-Contrast Text */}
        <div
          className="glass-panel wizard-header-card"
          style={{
            padding: '1.25rem 1.75rem',
            marginBottom: '24px',
            minHeight: '130px',
            background: 'linear-gradient(135deg, #0B192C 0%, #152A47 100%)',
            border: '1px solid rgba(59, 130, 246, 0.28)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93C5FD'
                }}
              >
                <Building size={12} /> {service.department || 'Municipal Administration & Urban Development'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#FCD34D'
                }}
              >
                {application.status || 'DRAFT'}
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.35rem, 2.5vw, 1.8rem)',
                color: '#FFFFFF',
                margin: 0,
                fontWeight: 700,
                letterSpacing: '-0.01em'
              }}
            >
              {service.name} Application
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0.3rem 0 0 0', lineHeight: 1.4 }}>
              Complete your application step by step.
            </p>
          </div>

          {/* Compact Right: Application ID Card */}
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              textAlign: 'right',
              minWidth: '160px'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '2px'
              }}
            >
              APPLICATION ID
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#38BDF8',
                letterSpacing: '0.04em'
              }}
            >
              {application.id}
            </div>
          </div>
        </div>

        {/* 6-Step Horizontal Progress Stepper */}
        <div
          className="glass-panel wizard-stepper-container"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {/* Desktop Stepper */}
          <div className="desktop-stepper-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            {WIZARD_STEPS.map((step, idx) => {
              const isCompleted = step.num < currentStep;
              const isActive = step.num === currentStep;
              const isLocked = step.num > currentStep;

              return (
                <React.Fragment key={step.num}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    {/* Circle Indicator */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive
                          ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                          : isCompleted
                          ? '#10B981'
                          : 'var(--bg-secondary)',
                        border: isActive
                          ? '2px solid #60A5FA'
                          : isCompleted
                          ? '2px solid #10B981'
                          : '1px solid var(--border-subtle)',
                        color: (isCompleted || isActive) ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.4)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : isLocked ? (
                        <Lock size={13} />
                      ) : (
                        `0${step.num}`
                      )}
                    </div>

                    {/* Step Title & Status */}
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {step.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: isActive ? '#3B82F6' : isCompleted ? '#10B981' : 'var(--text-muted)',
                          fontWeight: isActive ? 600 : 400
                        }}
                      >
                        {isCompleted ? 'Done' : isActive ? 'In Progress' : 'Locked'}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line between steps */}
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      style={{
                        flex: '0 1 28px',
                        height: '2px',
                        background: isCompleted ? '#10B981' : 'var(--border-subtle)',
                        borderRadius: '1px',
                        transition: 'background 0.3s ease',
                        margin: '0 0.25rem'
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Fallback Progress Bar */}
          <div className="mobile-stepper-summary" style={{ display: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Step {currentStep} of 6: {WIZARD_STEPS[currentStep - 1]?.name}
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                {Math.round((currentStep / 6) * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(currentStep / 6) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Global Floating Toast for Save Draft / Success Feedback */}
        {successMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: '#059669',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              animation: 'slideInToast 0.25s ease-out'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.88rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step Content Slot */}
        {children}

        <style>{`
          @media (max-width: 900px) {
            .desktop-stepper-row {
              display: none !important;
            }
            .mobile-stepper-summary {
              display: block !important;
            }
          }
          @keyframes slideInToast {
            from {
              transform: translateY(-12px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export { WIZARD_STEPS };
export default WizardLayout;
