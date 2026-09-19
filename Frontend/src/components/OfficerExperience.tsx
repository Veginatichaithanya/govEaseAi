import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const OfficerExperience: React.FC = () => {
  const stages = [
    { name: 'Submitted Application', note: 'Intake data & fee token logged' },
    { name: 'Document & AI Extraction', note: 'Multimodal OCR field extraction' },
    { name: 'Verification Warnings', note: 'Discrepancy flags surfaced' },
    { name: 'Officer Review', note: 'Statutory desk appraisal', isKey: true },
    { name: 'Correction / Reject / Approve', note: 'Discretionary decision by officer' },
    { name: 'Digital Approval Issued', note: 'Cryptographically sealed permit' }
  ];

  return (
    <section className="section-wrapper" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div
            className="section-eyebrow"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: '#60A5FA'
            }}
          >
            <UserCheck size={13} />
            OFFICER DECISION WORKSPACE
          </div>
          <h2>Human Review at the Center</h2>
          <p className="section-subtitle">
            AI provides supporting intelligence and highlights anomalies. Authorized government
            officers preserve complete discretionary authority over every single permit.
          </p>
        </div>

        {/* Officer Flow Chart */}
        <div className="officer-pipeline-diagram">
          {stages.map((stage, idx) => (
            <React.Fragment key={idx}>
              <div className={`officer-stage-card ${stage.isKey ? 'key-stage' : ''}`}>
                <div className="stage-idx">{idx + 1}</div>
                <h4 className="stage-name">{stage.name}</h4>
                <p className="stage-note">{stage.note}</p>
                {stage.isKey && (
                  <span className="badge badge-success" style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>
                    Human Authority
                  </span>
                )}
              </div>
              {idx < stages.length - 1 && (
                <div className="officer-flow-arrow" aria-hidden="true">
                  <ArrowRight size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Interactive Officer Review Workbench Preview Card */}
        <div className="glass-panel officer-workbench-preview" style={{ marginTop: '3rem' }}>
          <div className="workbench-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="officer-avatar">
                <UserCheck size={20} color="#FFFFFF" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', margin: 0 }}>
                  Licensing Officer Appraisal Desk
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Municipal Ward 10 • Desk Officer: S. Narayanan (ID: MAUD-OFF-4091)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                Action Required: Review Discrepancy
              </span>
              <Link
                to="/officer/login"
                className="btn btn-primary"
                style={{
                  fontSize: '0.76rem',
                  padding: '0.35rem 0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                Launch Officer Portal <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="workbench-body">
            <div className="workbench-grid">
              {/* Left Column: AI Decision Support Summary */}
              <div className="support-column">
                <span className="col-header">AI DECISION SUPPORT SUMMARY</span>

                <div className="ai-finding-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <Sparkles size={15} color="#22D3EE" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
                      Automated Pre-Screening Findings
                    </span>
                  </div>
                  <ul className="finding-list">
                    <li>
                      <FileCheck2 size={13} color="#10B981" />
                      Applicant identity confirmed with Aadhaar registry checksum.
                    </li>
                    <li>
                      <FileCheck2 size={13} color="#10B981" />
                      Commercial floor plan indicates 650 sq ft (Class-B Retail).
                    </li>
                    <li>
                      <AlertTriangle size={13} color="#F59E0B" />
                      Address mismatch: Form specifies 'Flat 42B', lease indicates 'Plot 42'.
                    </li>
                  </ul>
                  <div className="finding-notice">
                    AI recommendation: Officer clarification or physical verification recommended for premise address.
                  </div>
                </div>
              </div>

              {/* Right Column: Officer Discretionary Action Panel */}
              <div className="action-column">
                <span className="col-header">STATUTORY OFFICER ACTION</span>

                <div className="officer-actions-wrapper">
                  <p style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    As an authorized officer, select your determination following administrative guidelines:
                  </p>

                  <div className="decision-button-group">
                    <button
                      className="decision-btn approve"
                      onClick={() => alert('Demo prototype: Approving would digitally sign the permit certificate.')}
                    >
                      <CheckCircle2 size={17} />
                      Approve Application
                    </button>

                    <button
                      className="decision-btn clarify"
                      onClick={() => alert('Demo prototype: Requesting citizen address clarification on registered deed.')}
                    >
                      <RotateCcw size={17} />
                      Request Clarification
                    </button>

                    <button
                      className="decision-btn reject"
                      onClick={() => alert('Demo prototype: Rejection recorded with statutory grounds.')}
                    >
                      <XCircle size={17} />
                      Reject with Reason
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Crucial Governance Callout */}
            <div className="officer-governance-strip">
              <ShieldCheck size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
              <span>
                <strong>Statutory Safeguard:</strong> "AI provides supporting information. Authorized
                officers make the final decision." No permit is ever automatically approved or rejected by an algorithm.
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .officer-pipeline-diagram {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .officer-stage-card {
          flex: 1;
          min-width: 155px;
          background: rgba(11, 25, 45, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-md);
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .officer-stage-card.key-stage {
          background: rgba(8, 28, 52, 0.9);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 20px -3px rgba(16, 185, 129, 0.18);
        }

        .stage-idx {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          color: #93C5FD;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .stage-name {
          font-family: var(--font-display);
          font-size: 0.85rem;
          color: #FFFFFF;
          margin-bottom: 0.25rem;
        }

        .stage-note {
          font-size: 0.72rem;
          color: #94A3B8;
          line-height: 1.35;
          margin: 0;
        }

        .officer-flow-arrow {
          color: #475569;
          flex-shrink: 0;
        }

        .officer-workbench-preview {
          border: 1px solid rgba(59, 130, 246, 0.25);
          background: rgba(10, 22, 39, 0.88);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .workbench-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.75rem;
          background: rgba(7, 17, 31, 0.75);
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .officer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .workbench-body {
          padding: 1.75rem;
        }

        .workbench-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .col-header {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94A3B8;
          display: block;
          margin-bottom: 0.85rem;
        }

        .ai-finding-card {
          background: rgba(15, 31, 53, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .finding-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .finding-list li {
          font-size: 0.825rem;
          color: #CBD5E1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .finding-notice {
          font-size: 0.75rem;
          color: #38BDF8;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius-sm);
        }

        .officer-actions-wrapper {
          background: rgba(15, 31, 53, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .decision-button-group {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .decision-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 600;
          padding: 0.65rem 1rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .decision-btn.approve {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34D399;
        }
        .decision-btn.approve:hover {
          background: rgba(16, 185, 129, 0.28);
        }

        .decision-btn.clarify {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #FBBF24;
        }
        .decision-btn.clarify:hover {
          background: rgba(245, 158, 11, 0.28);
        }

        .decision-btn.reject {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #F87171;
        }
        .decision-btn.reject:hover {
          background: rgba(239, 68, 68, 0.28);
        }

        .officer-governance-strip {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1.15rem;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.22);
          border-radius: var(--radius-sm);
          font-size: 0.825rem;
          color: #CBD5E1;
          line-height: 1.45;
        }

        @media (max-width: 900px) {
          .workbench-grid {
            grid-template-columns: 1fr;
          }
          .officer-pipeline-diagram {
            flex-direction: column;
            align-items: stretch;
          }
          .officer-flow-arrow {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default OfficerExperience;
