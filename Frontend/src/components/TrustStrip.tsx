import React from 'react';
import { Cpu, ShieldCheck, SearchCheck, UserCheck, Activity, Zap, CheckCircle2, Award } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const metrics = [
    {
      icon: Zap,
      value: '99.4%',
      label: 'OCR Precision',
      desc: 'Multimodal document tokenization'
    },
    {
      icon: Activity,
      value: '< 3s',
      label: 'Rule 14 Check',
      desc: 'Instant cross-match matrix'
    },
    {
      icon: Award,
      value: '100%',
      label: 'Officer Discretion',
      desc: 'Zero automated approvals'
    },
    {
      icon: CheckCircle2,
      value: '6+',
      label: 'Active Services',
      desc: 'Trade, construction & environment'
    }
  ];

  const pillars = [
    {
      icon: Cpu,
      title: 'AI-Assisted Workflow',
      desc: 'Multimodal OCR and data structuring eliminate tedious manual intake for citizens.'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-Preserving Proofs',
      desc: 'Client-side verification flags and secure handling of sensitive identity proofs.'
    },
    {
      icon: SearchCheck,
      title: 'Transparent Status Tracking',
      desc: 'Real-time visibility into application review checkpoints and departmental desk timeline.'
    },
    {
      icon: UserCheck,
      title: 'Human-Controlled Sanction',
      desc: 'Authorized government licensing officers retain sole statutory decision authority.'
    }
  ];

  return (
    <section
      className="trust-strip-section reveal-on-scroll"
      style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'rgba(8, 20, 36, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(148, 163, 184, 0.12)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        padding: '3rem 0'
      }}
    >
      <div className="container">
        {/* Top High-Trust Metrics Row */}
        <div className="trust-metrics-grid">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="trust-metric-item hover-lift">
                <div className="metric-icon-wrap">
                  <Icon size={18} color="#22D3EE" />
                </div>
                <div className="metric-text-wrap">
                  <div className="metric-value-row">
                    <span className="metric-val">{m.value}</span>
                    <span className="metric-lbl">{m.label}</span>
                  </div>
                  <span className="metric-desc">{m.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle Horizontal Divider */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.2), transparent)',
            margin: '2rem 0'
          }}
        />

        {/* 4 Core Architecture Pillars */}
        <div className="trust-strip-grid">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="trust-pillar-card hover-lift">
                <div className="trust-pillar-icon">
                  <Icon size={20} color="#38BDF8" strokeWidth={2} />
                </div>
                <div className="trust-pillar-text">
                  <h4 className="trust-pillar-title">{item.title}</h4>
                  <p className="trust-pillar-desc">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .trust-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .trust-metric-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(12, 28, 52, 0.55);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-md);
        }

        .metric-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .metric-val {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .metric-lbl {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-cyan-light);
          text-transform: uppercase;
        }

        .metric-desc {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 0.2rem;
        }

        .trust-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .trust-pillar-card {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 1rem 1.15rem;
          background: rgba(12, 28, 52, 0.35);
          border: 1px solid rgba(148, 163, 184, 0.08);
          border-radius: var(--radius-md);
        }

        .trust-pillar-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .trust-pillar-title {
          font-family: var(--font-display);
          font-size: 0.925rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 0.25rem;
        }

        .trust-pillar-desc {
          font-size: 0.8rem;
          color: #94A3B8;
          line-height: 1.45;
          margin: 0;
        }

        /* Light Theme Overrides */
        [data-theme="light"] .trust-strip-section {
          background-color: #FFFFFF !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .trust-metric-item {
          background: #F8FAFC !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .metric-val {
          color: #0F172A !important;
        }

        [data-theme="light"] .metric-lbl {
          color: #0284C7 !important;
        }

        [data-theme="light"] .metric-desc {
          color: #64748B !important;
        }

        [data-theme="light"] .trust-pillar-card {
          background: #F8FAFC !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .trust-pillar-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .trust-pillar-desc {
          color: #475569 !important;
        }

        @media (max-width: 1024px) {
          .trust-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .trust-strip-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .trust-metrics-grid {
            grid-template-columns: 1fr;
          }
          .trust-strip-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustStrip;
