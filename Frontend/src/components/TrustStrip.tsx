import React from 'react';
import { Cpu, ShieldCheck, SearchCheck, UserCheck } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const pillars = [
    {
      icon: Cpu,
      title: 'AI-Assisted Workflow',
      desc: 'Multimodal OCR and data structuring expedite initial form filling.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Document Handling',
      desc: 'Client-side verification flags and privacy-preserving document storage.'
    },
    {
      icon: SearchCheck,
      title: 'Transparent Status Tracking',
      desc: 'Real-time visibility into application review checkpoints and timeline.'
    },
    {
      icon: UserCheck,
      title: 'Human-Controlled Approval',
      desc: 'Authorized government officers retain sole statutory decision authority.'
    }
  ];

  return (
    <section
      className="trust-strip-section"
      style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'rgba(8, 20, 36, 0.75)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '2.25rem 0'
      }}
    >
      <div className="container">
        <div className="trust-strip-grid">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="trust-pillar-card">
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
        .trust-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .trust-pillar-card {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 0.75rem 0.5rem;
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
          margin-bottom: 0.2rem;
        }

        .trust-pillar-desc {
          font-size: 0.8rem;
          color: #94A3B8;
          line-height: 1.45;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .trust-strip-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .trust-strip-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustStrip;
