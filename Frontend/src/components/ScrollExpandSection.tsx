import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  FileEdit,
  UploadCloud,
  Cpu,
  CheckCircle2,
  LineChart
} from 'lucide-react';
import ScrollExpand from './ScrollExpand';

export const ScrollExpandSection: React.FC = () => {
  const workflowNodes = [
    { title: 'Choose Service', icon: Compass },
    { title: 'Complete Application', icon: FileEdit },
    { title: 'Upload Documents', icon: UploadCloud },
    { title: 'AI-Assisted Processing', icon: Cpu, isAi: true },
    { title: 'Review & Submit', icon: CheckCircle2 },
    { title: 'Track Status', icon: LineChart }
  ];

  const scrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="scroll-expand-section-wrapper" style={{ position: 'relative', zIndex: 20 }}>
      <ScrollExpand
        src="/govease-dashboard-preview.svg"
        mediaType="image"
        alt="GovEaseAI government service application workflow"
        title="Government Services, Simplified with AI."
        scrollHint="Scroll to explore"
        startWidth={48}
        startHeight={58}
        startRadius={24}
        endRadius={0}
        mediaZoom={1.2}
        scrollDistance={1.15}
        holdDistance={0.25}
        smoothing={0.08}
        overlayScrim={0.55}
        useWindowScroll
        enabled
      >
        <div className="scroll-expand-overlay-content">
          {/* Badge */}
          <div
            className="section-eyebrow"
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              borderColor: 'rgba(6, 182, 212, 0.4)',
              color: '#22D3EE',
              marginBottom: '1rem'
            }}
          >
            <Sparkles size={12} />
            AI-ASSISTED GOVERNMENT SERVICES
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
              color: '#FFFFFF',
              lineHeight: 1.15,
              marginBottom: '1rem',
              fontWeight: 800
            }}
          >
            From Application <br />
            <span style={{ color: 'var(--accent-cyan-light)' }}>to Decision</span>
          </h2>

          {/* Description */}
          <p
            style={{
              maxWidth: '680px',
              fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
              color: '#CBD5E1',
              lineHeight: 1.6,
              marginBottom: '1.75rem'
            }}
          >
            GovEaseAI helps citizens complete government applications, process supporting documents,
            review AI-assisted verification results, and track their application status.
          </p>

          {/* Compact Workflow Visual Pipeline */}
          <div className="compact-workflow-strip">
            {workflowNodes.map((node, idx) => {
              const Icon = node.icon;
              return (
                <React.Fragment key={idx}>
                  <div className={`workflow-node-pill ${node.isAi ? 'ai-node' : ''}`}>
                    <div className="node-icon">
                      <Icon size={14} color={node.isAi ? '#22D3EE' : '#60A5FA'} />
                    </div>
                    <span className="node-label">{node.title}</span>
                  </div>
                  {idx < workflowNodes.length - 1 && (
                    <span className="node-separator">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Principle Statement */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#94A3B8',
              background: 'rgba(7, 17, 31, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              padding: '0.4rem 0.95rem',
              borderRadius: 'var(--radius-pill)',
              marginBottom: '2rem'
            }}
          >
            <ShieldCheck size={14} color="#10B981" />
            <strong style={{ color: '#F8FAFC' }}>AI assists.</strong> Authorized officers decide.
          </div>

          {/* Call to Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to="/services"
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.85rem', fontSize: '0.95rem' }}
            >
              Explore Government Services <ArrowRight size={17} />
            </Link>

            <a
              href="#how-it-works"
              onClick={scrollToHowItWorks}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.65rem', fontSize: '0.95rem' }}
            >
              Learn How It Works
            </a>
          </div>
        </div>
      </ScrollExpand>

      <style>{`
        .scroll-expand-overlay-content {
          max-width: 920px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .compact-workflow-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          max-width: 860px;
        }

        .workflow-node-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.75rem;
          background: rgba(12, 28, 52, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: var(--radius-sm);
        }

        .workflow-node-pill.ai-node {
          background: rgba(6, 182, 212, 0.18);
          border-color: rgba(6, 182, 212, 0.45);
          box-shadow: 0 0 16px -3px rgba(6, 182, 212, 0.3);
        }

        .node-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .node-label {
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 600;
          color: #F1F5F9;
        }

        .node-separator {
          color: #475569;
          font-weight: 700;
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .compact-workflow-strip {
            gap: 0.35rem;
          }
          .workflow-node-pill {
            padding: 0.3rem 0.55rem;
          }
          .node-label {
            font-size: 0.72rem;
          }
          .node-separator {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default ScrollExpandSection;
