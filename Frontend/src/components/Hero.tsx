import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  FileCheck2,
  Cpu,
  UserCheck,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const Hero: React.FC = () => {
  const scrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState(null, '', '#how-it-works');
    const el = document.getElementById('how-it-works');
    if (el) {
      const navHeight = 72;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navHeight - 16),
        behavior: 'smooth'
      });
    }
  };

  return (
    <section
      className="hero-section"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'calc(var(--nav-height) + 2.5rem)',
        paddingBottom: '4.5rem',
        overflow: 'hidden'
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="hero-grid">
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="hero-content">
            <div className="section-eyebrow" style={{ alignSelf: 'flex-start' }}>
              <Sparkles size={13} />
              AI-POWERED GOVERNMENT SERVICES
            </div>

            <h1 className="hero-title">
              Government Services, <br />
              <span className="hero-title-highlight">Simplified with AI.</span>
            </h1>

            <p className="hero-description">
              Apply for government services with guided applications, intelligent document processing,
              and transparent application tracking — all in one place.
            </p>

            {/* CTAs */}
            <div className="hero-cta-group">
              <Link to="/services" className="btn btn-primary" style={{ padding: '0.85rem 1.65rem' }}>
                Explore Government Services <ArrowRight size={17} />
              </Link>

              <a
                href="#how-it-works"
                onClick={scrollToHowItWorks}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.45rem' }}
              >
                How It Works
              </a>
            </div>

            {/* Trust Statement */}
            <div className="hero-trust-bar">
              <div className="trust-pill">
                <span className="trust-dot" />
                AI-assisted
              </div>
              <span className="trust-divider">•</span>
              <div className="trust-pill">
                <span className="trust-dot" style={{ backgroundColor: '#10B981' }} />
                Human-reviewed
              </div>
              <span className="trust-divider">•</span>
              <div className="trust-pill">
                <span className="trust-dot" style={{ backgroundColor: '#06B6D4' }} />
                Transparent
              </div>
            </div>

            {/* Academic Prototype Notice */}
            <div
              style={{
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}
            >
              <ShieldAlert size={12} color="#94A3B8" />
              Final-year project prototype. Final approval remains with authorized government officers.
            </div>
          </div>

          {/* Right Column: Interactive Conceptual Product Preview Card */}
          <div className="hero-visual-wrapper">
            <div className="hero-card-glow" />
            <div className="glass-panel hero-product-card">
              {/* Card Window Header */}
              <div className="product-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="window-dot red" />
                  <div className="window-dot yellow" />
                  <div className="window-dot green" />
                  <span className="header-label">GovEaseAI Application Scrutiny Engine</span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                  PROTOTYPE PREVIEW
                </span>
              </div>

              {/* Card Main Info */}
              <div className="product-card-body">
                <div className="application-meta">
                  <div>
                    <span className="meta-label">APPLICATION TYPE</span>
                    <h3 className="meta-title">Trade License (Commercial Retail)</h3>
                  </div>
                  <div className="token-id">
                    <span className="meta-label">TRACKING ID</span>
                    <span className="token-value">GEAI-2026-000001</span>
                  </div>
                </div>

                {/* Workflow Steps Preview */}
                <div className="workflow-steps">
                  {/* Step 1 */}
                  <div className="step-item step-completed">
                    <div className="step-icon-box">
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <div className="step-content">
                      <div className="step-row">
                        <span className="step-title">Applicant Details</span>
                        <span className="badge badge-success">Completed</span>
                      </div>
                      <span className="step-detail">Aadhaar verified • Commercial identity confirmed</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="step-item step-completed">
                    <div className="step-icon-box">
                      <FileCheck2 size={16} color="#10B981" />
                    </div>
                    <div className="step-content">
                      <div className="step-row">
                        <span className="step-title">Documents Ingested</span>
                        <span className="badge badge-success">4/4 Uploaded</span>
                      </div>
                      <span className="step-detail">Lease deed, Fire safety NOC, Floor layout plan</span>
                    </div>
                  </div>

                  {/* Step 3 (Active) */}
                  <div className="step-item step-active">
                    <div className="step-icon-box active-pulse">
                      <Cpu size={16} color="#22D3EE" />
                    </div>
                    <div className="step-content">
                      <div className="step-row">
                        <span className="step-title active-title">
                          AI Verification Extraction
                        </span>
                        <span className="badge badge-info" style={{ animation: 'pulse 2s infinite' }}>
                          AI-assisted review
                        </span>
                      </div>
                      <span className="step-detail active-detail">
                        Multimodal OCR complete • 1 address review flagged for officer
                      </span>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="step-item step-pending">
                    <div className="step-icon-box">
                      <UserCheck size={16} color="#64748B" />
                    </div>
                    <div className="step-content">
                      <div className="step-row">
                        <span className="step-title">Authorized Officer Review</span>
                        <span className="badge badge-neutral">In Queue</span>
                      </div>
                      <span className="step-detail">Awaiting municipal licensing officer evaluation</span>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="step-item step-pending">
                    <div className="step-icon-box">
                      <Clock size={16} color="#64748B" />
                    </div>
                    <div className="step-content">
                      <div className="step-row">
                        <span className="step-title">Final Decision & Certificate</span>
                        <span className="badge badge-neutral">Pending</span>
                      </div>
                      <span className="step-detail">Statutory seal & digital signing upon officer sanction</span>
                    </div>
                  </div>
                </div>

                {/* Footer Status Strip */}
                <div className="product-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="status-ping" />
                    <div>
                      <div className="footer-status-title" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        Status: AI-Assisted Review Active
                      </div>
                      <div className="footer-status-desc" style={{ fontSize: '0.7rem' }}>
                        Officer decision authority preserved • Zero automated approval
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/services/trade-license"
                    className="footer-inspect-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Inspect <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
        }

        .hero-title {
          margin-top: 1rem;
          margin-bottom: 1.25rem;
          color: #FFFFFF;
        }

        .hero-title-highlight {
          background: linear-gradient(135deg, #60A5FA 0%, #22D3EE 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          font-size: 1.15rem;
          color: #94A3B8;
          max-width: 540px;
          line-height: 1.68;
          margin-bottom: 2.25rem;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .hero-trust-bar {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-top: 2rem;
          font-size: 0.875rem;
          color: #CBD5E1;
          flex-wrap: wrap;
        }

        .trust-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 500;
        }

        .trust-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--accent-blue-light);
          display: inline-block;
        }

        .trust-divider {
          color: #475569;
        }

        .hero-visual-wrapper {
          position: relative;
        }

        .hero-card-glow {
          position: absolute;
          inset: -15px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 75%);
          filter: blur(28px);
          z-index: 0;
          pointer-events: none;
        }

        .hero-product-card {
          position: relative;
          z-index: 1;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: rgba(10, 22, 39, 0.88);
          border-radius: var(--radius-lg);
          box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.7);
        }

        .product-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          background: rgba(7, 17, 31, 0.5);
          border-top-left-radius: var(--radius-lg);
          border-top-right-radius: var(--radius-lg);
        }

        .window-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .window-dot.red { background-color: #EF4444; opacity: 0.7; }
        .window-dot.yellow { background-color: #F59E0B; opacity: 0.7; }
        .window-dot.green { background-color: #10B981; opacity: 0.7; }

        .header-label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #94A3B8;
          margin-left: 0.25rem;
        }

        .product-card-body {
          padding: 1.35rem 1.35rem 1.15rem 1.35rem;
        }

        .application-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.1rem;
          margin-bottom: 1.15rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
        }

        .meta-label {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: #64748B;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.2rem;
        }

        .meta-title {
          font-size: 1.05rem;
          color: #FFFFFF;
          margin: 0;
        }

        .token-value {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--accent-cyan-light);
        }

        .workflow-steps {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          background: rgba(15, 31, 53, 0.45);
          border: 1px solid rgba(148, 163, 184, 0.08);
          transition: border-color 0.2s ease;
        }

        .step-item.step-active {
          background: rgba(6, 182, 212, 0.08);
          border-color: rgba(6, 182, 212, 0.35);
          box-shadow: 0 0 16px -3px rgba(6, 182, 212, 0.2);
        }

        .step-icon-box {
          margin-top: 0.15rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .active-pulse {
          animation: iconPulse 2s infinite ease-in-out;
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #22D3EE); }
          50% { transform: scale(1.18); filter: drop-shadow(0 0 6px #22D3EE); }
        }

        .step-content {
          flex: 1;
        }

        .step-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.2rem;
        }

        .step-title {
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 600;
          color: #E2E8F0;
        }

        .step-detail {
          font-size: 0.75rem;
          color: #64748B;
          display: block;
        }

        .product-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.95rem;
          background: rgba(7, 17, 31, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: var(--radius-sm);
        }

        .status-ping {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #22D3EE;
          box-shadow: 0 0 10px #22D3EE;
          display: inline-block;
          animation: ping 1.8s infinite;
        }

        @keyframes ping {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .active-title {
          color: #22D3EE;
        }

        .active-detail {
          color: #CBD5E1;
        }

        .footer-status-title {
          color: #FFFFFF;
        }

        .footer-status-desc {
          color: #94A3B8;
        }

        .footer-inspect-link {
          color: var(--accent-cyan-light);
        }

        /* Light Mode Specific Overrides for Hero Product Preview */
        [data-theme="light"] .hero-title-highlight {
          background: linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #0D9488 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        [data-theme="light"] .hero-product-card {
          background: #FFFFFF !important;
          border: 1px solid rgba(148, 163, 184, 0.35) !important;
          box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.8) !important;
        }

        [data-theme="light"] .hero-card-glow {
          background: radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, rgba(6, 182, 212, 0.06) 50%, transparent 75%) !important;
        }

        [data-theme="light"] .product-card-header {
          background: #F8FAFC !important;
          border-bottom: 1px solid #E2E8F0 !important;
        }

        [data-theme="light"] .header-label {
          color: #475569 !important;
          font-weight: 600;
        }

        [data-theme="light"] .application-meta {
          border-bottom: 1px solid #E2E8F0 !important;
        }

        [data-theme="light"] .meta-label {
          color: #64748B !important;
          font-weight: 600;
        }

        [data-theme="light"] .meta-title {
          color: #0F172A !important;
          font-weight: 700;
        }

        [data-theme="light"] .token-value {
          color: #0284C7 !important;
          font-weight: 700;
        }

        [data-theme="light"] .step-item {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        [data-theme="light"] .step-item:hover {
          border-color: #CBD5E1 !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
        }

        [data-theme="light"] .step-title {
          color: #0F172A !important;
          font-weight: 600;
        }

        [data-theme="light"] .step-detail {
          color: #475569 !important;
          font-weight: 400;
        }

        [data-theme="light"] .step-item.step-active {
          background: rgba(6, 182, 212, 0.07) !important;
          border-color: rgba(6, 182, 212, 0.55) !important;
          box-shadow: 0 0 16px -2px rgba(6, 182, 212, 0.22) !important;
        }

        [data-theme="light"] .active-title {
          color: #0891B2 !important;
          font-weight: 700;
        }

        [data-theme="light"] .active-detail {
          color: #1E293B !important;
          font-weight: 500;
        }

        [data-theme="light"] .step-item.step-pending {
          background: #F8FAFC !important;
          border: 1px solid #E2E8F0 !important;
        }

        [data-theme="light"] .step-item.step-pending .step-title {
          color: #1E293B !important;
          font-weight: 600;
        }

        [data-theme="light"] .step-item.step-pending .step-detail {
          color: #64748B !important;
        }

        [data-theme="light"] .product-card-footer {
          background: #F8FAFC !important;
          border: 1px solid #E2E8F0 !important;
        }

        [data-theme="light"] .footer-status-title {
          color: #0F172A !important;
          font-weight: 600;
        }

        [data-theme="light"] .footer-status-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .footer-inspect-link {
          color: #0284C7 !important;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .hero-content {
            text-align: center;
            align-items: center;
          }
          .hero-content .section-eyebrow {
            align-self: center !important;
          }
          .hero-description {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-cta-group {
            justify-content: center;
          }
          .hero-trust-bar {
            justify-content: center;
          }
          .hero-visual-wrapper {
            max-width: 580px;
            margin: 0 auto;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
