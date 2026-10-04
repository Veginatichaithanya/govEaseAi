import React, { useState } from 'react';
import {
  FileSearch,
  CheckCheck,
  HelpCircle,
  UserCheck,
  ShieldCheck,
  Bot,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AIAssistance: React.FC = () => {
  const [activeQueryIndex, setActiveQueryIndex] = useState<number>(0);

  const sampleQueries = [
    {
      q: 'What documents are required for a Municipal Trade License?',
      a: 'For a Municipal Trade License, GovEaseAI requires: (1) Identity Proof (Aadhaar or PAN Card), (2) Registered Commercial Lease Deed or Property Tax Title Deed, (3) Fire Safety NOC (for retail premises exceeding 500 sq ft), and (4) Floor layout blueprint. Ingestion is fully guided.',
      service: 'Trade License'
    },
    {
      q: 'What happens if my Aadhaar address has a typo compared to the lease?',
      a: "GovEaseAI's Rule 14 verification engine compares fields and flags this as 'REVIEW REQUIRED' with an 84% character confidence score. AI never automatically rejects or cancels your file; the discrepancy is highlighted cleanly for the municipal officer to review with your remarks.",
      service: 'Rule 14 Matrix'
    },
    {
      q: 'Can the AI system grant final government approval?',
      a: 'Zero automated approvals. In accordance with GovEaseAI Human Oversight principles (Rule 18), AI functions as an assistive intelligence layer. Only an authorized municipal licensing officer can sanction, request correction, or digitally seal a permit.',
      service: 'Statutory Governance'
    }
  ];

  const cards = [
    {
      num: '01',
      title: 'Document Intelligence',
      description:
        'Extract relevant information such as applicant names, registration numbers, property addresses, and validity dates from uploaded PDFs and scans.',
      icon: FileSearch,
      accent: 'var(--accent-cyan-light)',
      tags: ['Multimodal OCR', 'Entity Extraction', 'Field Tokenization']
    },
    {
      num: '02',
      title: 'Information Verification',
      description:
        'Cross-reference user-entered application fields against extracted document proofs, automatically highlighting potential discrepancies or missing items.',
      icon: CheckCheck,
      accent: 'var(--accent-blue-light)',
      tags: ['Discrepancy Highlighting', 'Validation Heuristics', 'Risk Screening']
    },
    {
      num: '03',
      title: 'Guided Assistance',
      description:
        'Help citizens understand complex zoning criteria, statutory fees, and step-by-step requirements before they commit their application for review.',
      icon: HelpCircle,
      accent: '#38BDF8',
      tags: ['Eligibility Guidance', 'Interactive Checklists', 'Process Clarity']
    }
  ];

  return (
    <section className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow shimmer-badge human-badge">
            <UserCheck size={13} />
            HUMAN-IN-THE-LOOP ARCHITECTURE
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>AI That Assists — Not Decides</h2>
          <p className="section-subtitle">
            GovEaseAI uses AI to help citizens and officers process information faster,
            while final government decisions remain strictly under authorized human control.
          </p>
        </div>

        {/* 3 Core AI Assistance Cards */}
        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel ai-pillar-card hover-lift glow-border-accent"
              >
                <div>
                  <div className="ai-pillar-top-row">
                    <div
                      className="ai-pillar-icon"
                      style={{ color: card.accent }}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="ai-pillar-num">
                      {card.num}
                    </span>
                  </div>

                  <h3 className="ai-pillar-title">
                    {card.title}
                  </h3>

                  <p className="ai-pillar-desc">
                    {card.description}
                  </p>
                </div>

                <div className="ai-pillar-tags-row">
                  {card.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="ai-pillar-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Interactive AI Guidance Query Simulator */}
        <div className="glass-panel ai-guidance-interactive-box hover-lift" style={{ marginBottom: '2.5rem' }}>
          <div className="guidance-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="bot-avatar">
                <Bot size={20} color="#22D3EE" />
              </div>
              <div>
                <span className="box-title">GovEaseAI Guidance Assistant // Live Demonstration</span>
                <span className="box-sub">Click a prompt to inspect statutory AI guidance responses</span>
              </div>
            </div>
            <Link to="/ai-guidance" className="btn btn-primary btn-sm">
              Open Full AI Assistant <ArrowRight size={14} />
            </Link>
          </div>

          <div className="guidance-query-chips">
            {sampleQueries.map((qItem, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveQueryIndex(idx)}
                className={`query-chip ${activeQueryIndex === idx ? 'active' : ''}`}
              >
                <MessageSquare size={14} />
                <span>{qItem.q}</span>
              </button>
            ))}
          </div>

          <div className="guidance-response-view">
            <div className="response-header-row">
              <span className="response-tag">GROUNDED STATUTORY GUIDANCE</span>
              <span className="response-badge">{sampleQueries[activeQueryIndex].service}</span>
            </div>
            <p className="response-text">{sampleQueries[activeQueryIndex].a}</p>
          </div>
        </div>

        {/* Governance & Human-in-the-Loop Callout Banner */}
        <div className="glass-panel governance-callout-banner hover-lift glow-border-accent">
          <div className="gov-banner-content">
            <div className="gov-banner-icon-box">
              <ShieldCheck size={24} color="#10B981" />
            </div>
            <div>
              <h4 className="gov-banner-title">
                Ethical AI Governance Principle
              </h4>
              <p className="gov-banner-desc">
                GovEaseAI functions as an intelligence layer to reduce clerical overhead. The software
                never overrides, bypasses, or replaces the statutory discretion of designated government
                licensing officers.
              </p>
            </div>
          </div>

          <div className="gov-banner-badge">
            Zero Automated Approvals
          </div>
        </div>
      </div>

      <style>{`
        .human-badge {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #34D399;
        }

        .ai-pillar-card {
          padding: 2.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(59, 130, 246, 0.2);
          background: rgba(11, 25, 44, 0.75);
          border-radius: var(--radius-lg);
        }

        .ai-pillar-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .ai-pillar-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-pillar-num {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.3);
        }

        .ai-pillar-title {
          font-size: 1.25rem;
          color: #FFFFFF;
          margin-bottom: 0.85rem;
        }

        .ai-pillar-desc {
          font-size: 0.95rem;
          color: #94A3B8;
          line-height: 1.6;
          margin-bottom: 1.75rem;
        }

        .ai-pillar-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          border-top: 1px solid rgba(148, 163, 184, 0.08);
          padding-top: 1.25rem;
        }

        .ai-pillar-tag {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #CBD5E1;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }

        /* Guidance interactive box */
        .ai-guidance-interactive-box {
          padding: 1.75rem;
          background: var(--bg-secondary);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: var(--radius-lg);
        }

        .guidance-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.25rem;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .bot-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .box-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          display: block;
        }

        .box-sub {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .guidance-query-chips {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .query-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.95rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          color: #CBD5E1;
          font-family: var(--font-body);
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .query-chip:hover {
          color: #FFFFFF;
          border-color: rgba(6, 182, 212, 0.4);
          background: rgba(18, 42, 74, 0.85);
        }

        .query-chip.active {
          color: #FFFFFF;
          background: rgba(6, 182, 212, 0.2);
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 14px -2px rgba(6, 182, 212, 0.3);
        }

        .guidance-response-view {
          padding: 1.25rem;
          background: var(--bg-card);
          border-left: 3px solid #06B6D4;
          border-radius: var(--radius-sm);
        }

        .response-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.65rem;
        }

        .response-tag {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: #22D3EE;
          letter-spacing: 0.05em;
        }

        .response-badge {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.15rem 0.55rem;
          border-radius: 4px;
        }

        .response-text {
          font-size: 0.92rem;
          color: #E2E8F0;
          line-height: 1.6;
          margin: 0;
        }

        /* Governance callout banner */
        .governance-callout-banner {
          padding: 1.75rem 2.25rem;
          background: linear-gradient(135deg, rgba(8, 28, 52, 0.9) 0%, rgba(12, 38, 70, 0.85) 100%);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .gov-banner-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          max-width: 800px;
        }

        .gov-banner-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gov-banner-title {
          color: #FFFFFF;
          margin-bottom: 0.25rem;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .gov-banner-desc {
          font-size: 0.88rem;
          color: #94A3B8;
          margin: 0;
          line-height: 1.55;
        }

        .gov-banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: #34D399;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.45rem 0.95rem;
          border-radius: var(--radius-pill);
          white-space: nowrap;
        }

        /* =======================================================
           LIGHT THEME OVERRIDES (CRITICAL FIX FOR USER SCREENSHOTS)
           ======================================================= */
        [data-theme="light"] .ai-pillar-card {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06) !important;
        }

        [data-theme="light"] .ai-pillar-icon {
          background: #EFF6FF !important;
          border-color: #BFDBFE !important;
        }

        [data-theme="light"] .ai-pillar-num {
          color: #CBD5E1 !important;
        }

        [data-theme="light"] .ai-pillar-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .ai-pillar-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .ai-pillar-tags-row {
          border-top-color: #E2E8F0 !important;
        }

        [data-theme="light"] .ai-pillar-tag {
          background: #F1F5F9 !important;
          border-color: #CBD5E1 !important;
          color: #334155 !important;
        }

        [data-theme="light"] .ai-guidance-interactive-box {
          background: #FFFFFF !important;
          border-color: #E2E8F0 !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06) !important;
        }

        [data-theme="light"] .box-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .box-sub {
          color: #64748B !important;
        }

        [data-theme="light"] .bot-avatar {
          background: #EFF6FF !important;
          border-color: #BFDBFE !important;
        }

        [data-theme="light"] .query-chip {
          background: #F8FAFC !important;
          border-color: #CBD5E1 !important;
          color: #334155 !important;
        }

        [data-theme="light"] .query-chip:hover {
          background: #F1F5F9 !important;
          border-color: #94A3B8 !important;
          color: #0F172A !important;
        }

        [data-theme="light"] .query-chip.active {
          background: #EFF6FF !important;
          border-color: #3B82F6 !important;
          color: #1D4ED8 !important;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15) !important;
        }

        [data-theme="light"] .guidance-response-view {
          background: #F8FAFC !important;
          border-left-color: #0284C7 !important;
          border: 1px solid #E2E8F0 !important;
          border-left: 3px solid #0284C7 !important;
        }

        [data-theme="light"] .response-tag {
          color: #0284C7 !important;
        }

        [data-theme="light"] .response-badge {
          background: #E2E8F0 !important;
          color: #334155 !important;
        }

        [data-theme="light"] .response-text {
          color: #1E293B !important;
        }

        [data-theme="light"] .governance-callout-banner {
          background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%) !important;
          border-color: #86EFAC !important;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.08) !important;
        }

        [data-theme="light"] .gov-banner-icon-box {
          background: #DCFCE7 !important;
          border-color: #86EFAC !important;
        }

        [data-theme="light"] .gov-banner-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .gov-banner-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .gov-banner-badge {
          background: #DCFCE7 !important;
          border-color: #86EFAC !important;
          color: #15803D !important;
          font-weight: 700 !important;
        }
      `}</style>
    </section>
  );
};

export default AIAssistance;
