import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import OfficerLayout from '../components/officer/OfficerLayout';
import { officerAuth } from '../mock/auth';
import {
  applicationService,
  mergeApplicationsIntoStorage,
  type ApplicationRecord
} from '../mock/applicationService';
import { apiClient } from '../services/apiClient';
import {
  ShieldCheck,
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertCircle,
  QrCode,
  XCircle
} from 'lucide-react';

export const DigitalApprovalPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationRecord | null>(null);

  const isOfficer = location.pathname.startsWith('/officer');
  const currentOfficer = isOfficer ? officerAuth.getCurrentOfficer() : null;

  useEffect(() => {
    if (isOfficer && !officerAuth.getCurrentOfficer()) {
      navigate('/officer/login', { replace: true });
      return;
    }

    if (applicationId) {
      const found = applicationService.getApplicationById(applicationId);
      if (found) setApp(found);

      apiClient.get<ApplicationRecord>(`/applications/${applicationId}`).then((res) => {
        if (res.ok && res.data) {
          setApp(res.data);
          mergeApplicationsIntoStorage([res.data]);
        }
      }).catch(() => {});
    }
  }, [applicationId, isOfficer, navigate]);

  const LayoutComponent = isOfficer ? OfficerLayout : DashboardLayout;

  if (!app) {
    return (
      <LayoutComponent headerTitle={isOfficer ? "Digital Approval" : undefined}>
        <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Application Not Found</h3>
            <Link to={isOfficer ? "/officer/dashboard" : "/dashboard"} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  // Strict Officer Authorization Check
  if (isOfficer && currentOfficer && currentOfficer.departmentId !== app.departmentId) {
    return (
      <OfficerLayout headerTitle="Unauthorized Application">
        <div style={{ maxWidth: '640px', margin: '3rem auto', textAlign: 'center', padding: '0 1rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <XCircle size={32} color="var(--status-danger)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
              Unauthorized Application: Statutory Department Restriction
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This approval record belongs to another government department. Officers are restricted to applications within their statutory purview.
            </p>
            <Link to="/officer/dashboard" className="btn btn-primary">
              <ArrowLeft size={16} /> Return to Your Assigned Dashboard
            </Link>
          </div>
        </div>
      </OfficerLayout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const backLink = isOfficer ? `/officer/applications/${app.id}` : `/applications/${app.id}`;

  return (
    <LayoutComponent headerTitle={isOfficer ? "Digital Approval" : undefined}>
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: isOfficer ? '1.5rem 0' : undefined }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to={backLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} /> Back to Application Overview
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

        {/* Prototype Mandatory Alert Notice */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--bg-accent-subtle)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}
        >
          <AlertCircle size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Prototype Digital Approval Demonstration:</strong>{' '}
            This simulated digital sanction demonstrates digital government approval output. It is generated for
            engineering evaluation and does not represent an officially issued statutory government certificate.
          </div>
        </div>

        {/* Certificate Card Container */}
        <div
          className="glass-panel print-certificate"
          style={{
            padding: '3rem 2.5rem',
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-blue)',
            borderRadius: 'var(--radius-md)',
            position: 'relative'
          }}
        >
          {/* Top Seal & Heading */}
          <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem', marginBottom: '2rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                marginBottom: '1rem'
              }}
            >
              <ShieldCheck size={36} />
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: '0.25rem'
              }}
            >
              GOVERNMENT OF STATE • DIGITAL PORTAL
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
              Digital Sanction &amp; Approval
            </h2>

            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', margin: 0 }}>
              {app.department || 'Municipal Administration & Urban Development'}
            </p>
          </div>

          {/* Certificate Body */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              This certifies that the digital application submitted by{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {app.formData?.applicantName || app.formData?.fullName || 'Citizen Applicant'}
              </strong>{' '}
              for <strong style={{ color: 'var(--accent-blue)' }}>{app.serviceName}</strong> has completed desk
              scrutiny, automated verification, and statutory inspection. The competent departmental officer has granted
              formal administrative sanction under the applicable rules.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Application Token ID
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {app.id}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Sanction Reference
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
                  {app.approvalReference || 'GEAI/MAUD/BL/2026/89412'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Sanction Date
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {app.approvalDate || '11 September 2026'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Approving Desk Officer
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  S. Narayanan (MAUD Desk-4)
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Approval Status
                </span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                    <CheckCircle2 size={13} /> DIGITAL APPROVAL GRANTED
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Establishment
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {app.formData?.businessName || 'Apex Cloud Solutions'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Verification Stamp */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}
              >
                <QrCode size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Cryptographic Verification Seal
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  SHA-256: 7f8a9b2c...5d6e (Prototype Demonstration)
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GovEaseAI Digital System
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Final Year Engineering Project Demonstration
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
};

export default DigitalApprovalPage;
