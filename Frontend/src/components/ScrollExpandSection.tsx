import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileEdit,
  UploadCloud,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Award,
  ChevronRight,
  ExternalLink,
  Check
} from 'lucide-react';

export const ScrollExpandSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [officerApproved, setOfficerApproved] = useState<boolean>(false);

  const stages = [
    {
      id: 0,
      title: 'Smart Intake',
      subtitle: 'Citizen Application',
      icon: FileEdit,
      tag: 'Step 1'
    },
    {
      id: 1,
      title: 'Multimodal OCR',
      subtitle: 'Document Tokenization',
      icon: UploadCloud,
      tag: 'Step 2'
    },
    {
      id: 2,
      title: 'Rule 14 Verification',
      subtitle: 'Cross-Match Matrix',
      icon: Cpu,
      tag: 'Step 3'
    },
    {
      id: 3,
      title: 'Officer Oversight',
      subtitle: 'Statutory Sanction',
      icon: UserCheck,
      tag: 'Step 4'
    }
  ];

  const scrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="workflow-showcase"
      className="reveal-on-scroll"
      style={{
        position: 'relative',
        zIndex: 20,
        padding: '5rem 0 4rem 0',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '2.5rem' }}>
          <div className="section-eyebrow shimmer-badge">
            <Sparkles size={13} />
            LIVE ARCHITECTURAL PIPELINE
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>
            From Application Intake to Digital Sanction
          </h2>
          <p className="section-subtitle">
            Experience how GovEaseAI connects citizen forms, multimodal OCR, Rule 14 verification,
            and authorized officer oversight in real time.
          </p>
        </div>

        {/* Interactive Stage Selector Tabs */}
        <div className="pipeline-tab-strip">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStage === idx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(idx)}
                className={`pipeline-tab-btn ${isActive ? 'active' : ''}`}
              >
                <div className="tab-icon-box">
                  <Icon size={18} />
                </div>
                <div className="tab-text-box">
                  <span className="tab-step-tag">{stage.tag}</span>
                  <strong className="tab-title">{stage.title}</strong>
                  <span className="tab-sub">{stage.subtitle}</span>
                </div>
                {isActive && <div className="active-glow-indicator" />}
              </button>
            );
          })}
        </div>

        {/* Live Interactive Workspace Preview Card */}
        <div className="glass-panel showcase-terminal-card hover-lift glow-border-accent">
          {/* Terminal Window Header Bar */}
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="window-dot red" />
              <div className="window-dot yellow" />
              <div className="window-dot green" />
              <span className="terminal-title">
                GEAI-PIPELINE-SIMULATOR // Trade License (GEAI-2026-000001)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                <span className="live-pulse-dot" style={{ width: '6px', height: '6px', marginRight: '6px' }} />
                Stage {activeStage + 1} Active
              </span>
            </div>
          </div>

          {/* Interactive Stage Canvas */}
          <div className="terminal-canvas">
            {/* STAGE 0: Smart Intake */}
            {activeStage === 0 && (
              <div className="stage-content-view fade-in">
                <div className="stage-meta-row">
                  <div>
                    <span className="meta-badge">CITIZEN INTAKE PORTAL</span>
                    <h3 className="stage-heading">Structured Municipal Trade License Application</h3>
                    <p className="stage-desc">
                      Guided step-by-step form with contextual field validations, identity pre-checks,
                      and automatic document requirement determination.
                    </p>
                  </div>
                  <Link to="/services/trade-license" className="stage-action-link">
                    Start Real Form <ExternalLink size={14} />
                  </Link>
                </div>

                <div className="intake-form-mock-grid">
                  <div className="mock-form-field">
                    <label>Applicant Legal Name</label>
                    <div className="mock-input-box filled">
                      <span>Ravi Kumar</span>
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <small>Validated against Citizen Profile</small>
                  </div>

                  <div className="mock-form-field">
                    <label>Enterprise Trade Name</label>
                    <div className="mock-input-box filled">
                      <span>Kumar Commercial Retail</span>
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <small>Trade Category: Class-B Commercial</small>
                  </div>

                  <div className="mock-form-field">
                    <label>Commercial Premises Address</label>
                    <div className="mock-input-box filled">
                      <span>Shop 4, Commercial Complex, Jubilee Hills, Hyderabad</span>
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <small>Ward 12, Municipal Zone-West</small>
                  </div>

                  <div className="mock-form-field">
                    <label>Carpet Area (Square Feet)</label>
                    <div className="mock-input-box filled">
                      <span>650 sq ft</span>
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <small>Applicable Fee: ₹ 2,500 / annum</small>
                  </div>
                </div>

                <div className="stage-footer-callout">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <ShieldCheck size={18} color="#22D3EE" />
                    <span style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                      <strong>Real-Time Input Guard:</strong> Zero blank submissions permitted.
                      All mandatory statutory prerequisites verified before document ingestion.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStage(1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next: Multimodal OCR <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 1: Multimodal OCR Ingestion */}
            {activeStage === 1 && (
              <div className="stage-content-view fade-in">
                <div className="stage-meta-row">
                  <div>
                    <span className="meta-badge">MULTIMODAL AI DOCUMENT INGESTION</span>
                    <h3 className="stage-heading">Document Classification & Entity Extraction</h3>
                    <p className="stage-desc">
                      Uploaded Aadhaar scans and commercial lease agreements are classified,
                      scanned via OCR, and tokenized into structured JSON payloads.
                    </p>
                  </div>
                  <div className="confidence-pill">
                    <Sparkles size={14} color="#06B6D4" />
                    <span>OCR Precision: <strong>99.4%</strong></span>
                  </div>
                </div>

                <div className="ocr-preview-grid">
                  <div className="ocr-doc-card">
                    <div className="doc-card-header">
                      <span className="doc-type-tag">IDENTITY PROOF (AADHAAR)</span>
                      <span className="badge badge-success">Ingested & Parsed</span>
                    </div>
                    <div className="extracted-fields-list">
                      <div className="extracted-field">
                        <span className="k">Extracted Name:</span>
                        <strong className="v">Ravi Kumar</strong>
                      </div>
                      <div className="extracted-field">
                        <span className="k">ID Token:</span>
                        <strong className="v">XXXX-XXXX-1234</strong>
                      </div>
                      <div className="extracted-field">
                        <span className="k">Residential Address:</span>
                        <strong className="v">Plot 42, Road 10, Jubilee Hills</strong>
                      </div>
                    </div>
                  </div>

                  <div className="ocr-doc-card">
                    <div className="doc-card-header">
                      <span className="doc-type-tag">REGISTERED LEASE DEED</span>
                      <span className="badge badge-success">Ingested & Parsed</span>
                    </div>
                    <div className="extracted-fields-list">
                      <div className="extracted-field">
                        <span className="k">Lessee:</span>
                        <strong className="v">Ravi Kumar (Sole Prop.)</strong>
                      </div>
                      <div className="extracted-field">
                        <span className="k">Premises:</span>
                        <strong className="v">Shop 4, Jubilee Hills</strong>
                      </div>
                      <div className="extracted-field">
                        <span className="k">Carpet Area:</span>
                        <strong className="v">650 sq ft (Ground Floor)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stage-footer-callout">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Cpu size={18} color="#38BDF8" />
                    <span style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                      <strong>Privacy Architecture:</strong> Private documents are processed securely.
                      Raw scans remain unexposed to public endpoints.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStage(2)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next: Verification Matrix <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: Rule 14 Verification Matrix */}
            {activeStage === 2 && (
              <div className="stage-content-view fade-in">
                <div className="stage-meta-row">
                  <div>
                    <span className="meta-badge" style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                      RULE 14 AI VERIFICATION MATRIX
                    </span>
                    <h3 className="stage-heading">Application Data vs Document Proofs Cross-Match</h3>
                    <p className="stage-desc">
                      Automated heuristics compare submitted values with extracted proofs.
                      Exact matches are confirmed; discrepancies are explicitly flagged for human officer scrutiny.
                    </p>
                  </div>
                  <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>
                    1 Discrepancy Flagged
                  </span>
                </div>

                <div className="matrix-table-container">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>DATA ENTITY</th>
                        <th>APPLICATION VALUE</th>
                        <th>EXTRACTED DOCUMENT VALUE</th>
                        <th>AI VERIFICATION</th>
                        <th>CONFIDENCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Applicant Name</strong>
                        </td>
                        <td>Ravi Kumar</td>
                        <td>Ravi Kumar (Aadhaar)</td>
                        <td>
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> MATCH
                          </span>
                        </td>
                        <td>99.8%</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Identity Number</strong>
                        </td>
                        <td>XXXX-XXXX-1234</td>
                        <td>XXXX-XXXX-1234 (Aadhaar)</td>
                        <td>
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> MATCH
                          </span>
                        </td>
                        <td>99.5%</td>
                      </tr>
                      <tr className="row-flagged">
                        <td>
                          <strong>Premises Address</strong>
                        </td>
                        <td>Flat 42B, Jubilee Hills</td>
                        <td>Plot 42, Road 10, Jubilee Hills</td>
                        <td>
                          <span className="badge badge-warning">
                            <AlertTriangle size={12} /> REVIEW REQUIRED
                          </span>
                        </td>
                        <td>84.0%</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Carpet Area</strong>
                        </td>
                        <td>650 sq ft</td>
                        <td>650 sq ft (Lease Deed)</td>
                        <td>
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> MATCH
                          </span>
                        </td>
                        <td>98.2%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="stage-footer-callout">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <AlertTriangle size={18} color="#F59E0B" />
                    <span style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                      <strong>Strict Assistive Boundary:</strong> AI verification never auto-approves or auto-rejects.
                      The address discrepancy is routed to the municipal officer's evaluation queue.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStage(3)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next: Officer Scrutiny <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: Officer Oversight & Sanction */}
            {activeStage === 3 && (
              <div className="stage-content-view fade-in">
                <div className="stage-meta-row">
                  <div>
                    <span className="meta-badge" style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      RULE 18 STATUTORY OFFICER DESK
                    </span>
                    <h3 className="stage-heading">Authorized Human Review & Digital Sanction</h3>
                    <p className="stage-desc">
                      Municipal Licensing Officers review AI flags, verify applicant corrections,
                      and exercise statutory discretion to approve, request clarification, or issue permits.
                    </p>
                  </div>
                  <div className="officer-badge-pill">
                    <UserCheck size={14} color="#10B981" />
                    <span>Officer: S. Sharma (Ward 12 Desk)</span>
                  </div>
                </div>

                {officerApproved ? (
                  <div className="digital-sanction-card fade-in">
                    <div className="sanction-banner">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Award size={26} color="#10B981" />
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#FFFFFF' }}>
                            MUNICIPAL TRADE LICENSE SANCTIONED
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8' }}>
                            Statutory Reference: GEAI-SANCTION-2026-00892 • Issued Under Rule 18
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-success">DIGITALLY APPROVED</span>
                    </div>

                    <div className="sanction-details-grid">
                      <div>
                        <span className="s-label">LICENSEE</span>
                        <strong className="s-val">Ravi Kumar (Kumar Commercial Retail)</strong>
                      </div>
                      <div>
                        <span className="s-label">SANCTIONING AUTHORITY</span>
                        <strong className="s-val">Municipal Licensing Officer, Ward 12</strong>
                      </div>
                      <div>
                        <span className="s-label">VALIDITY PERIOD</span>
                        <strong className="s-val">2026-10-01 to 2027-09-30</strong>
                      </div>
                      <div>
                        <span className="s-label">DIGITAL SEAL</span>
                        <strong className="s-val" style={{ color: 'var(--accent-cyan-light)' }}>
                          SHA-256 Verified
                        </strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setOfficerApproved(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Reset Simulation
                      </button>
                      <Link to="/officer/dashboard" className="btn btn-primary btn-sm">
                        Go to Officer Portal <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="officer-review-actions-panel">
                    <div className="review-notes-box">
                      <h4 style={{ fontSize: '0.92rem', color: '#FFFFFF', marginBottom: '0.4rem' }}>
                        Officer Appraisal Summary:
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
                        "Reviewed AI flag: Address discrepancy is due to Door No. 42B versus Plot 42
                        cadastral survey demarcation. Verified with Ward Cadastral Map. Premises confirmed eligible."
                      </p>
                    </div>

                    <div className="review-action-buttons">
                      <button
                        type="button"
                        onClick={() => alert('Mock: Correction request routed to citizen Ravi Kumar with officer remarks.')}
                        className="btn btn-secondary"
                        style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        Request Correction
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfficerApproved(true)}
                        className="btn btn-primary"
                        style={{ padding: '0.65rem 1.45rem', fontSize: '0.85rem' }}
                      >
                        <Check size={16} /> Approve & Issue Digital Permit
                      </button>
                    </div>
                  </div>
                )}

                <div className="stage-footer-callout">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <ShieldCheck size={18} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                      <strong>Human Discretion Law:</strong> In accordance with project rules, zero permits are
                      granted automatically by AI. Every digital certificate requires affirmative officer sanction.
                    </span>
                  </div>
                  <Link to="/services" className="btn btn-secondary btn-sm">
                    Explore Services <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Quick Workflow Links */}
        <div className="showcase-bottom-links">
          <Link to="/services" className="btn btn-primary" style={{ padding: '0.85rem 1.85rem' }}>
            Explore Government Services <ArrowRight size={17} />
          </Link>
          <a
            href="#services"
            onClick={scrollToServices}
            className="btn btn-secondary"
            style={{ padding: '0.85rem 1.65rem' }}
          >
            Browse Service Catalog <ChevronRight size={17} />
          </a>
        </div>
      </div>

      <style>{`
        .pipeline-tab-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .pipeline-tab-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1rem 1.15rem;
          background: rgba(12, 28, 52, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .pipeline-tab-btn:hover {
          background: rgba(16, 38, 70, 0.85);
          border-color: rgba(6, 182, 212, 0.35);
        }

        .pipeline-tab-btn.active {
          background: rgba(8, 32, 60, 0.95);
          border-color: rgba(6, 182, 212, 0.55);
          box-shadow: 0 4px 20px -3px rgba(6, 182, 212, 0.25);
        }

        .tab-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: rgba(59, 130, 246, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-cyan-light);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .pipeline-tab-btn.active .tab-icon-box {
          background: rgba(6, 182, 212, 0.22);
          color: #22D3EE;
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.4);
        }

        .tab-text-box {
          display: flex;
          flex-direction: column;
        }

        .tab-step-tag {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pipeline-tab-btn.active .tab-step-tag {
          color: #22D3EE;
        }

        .tab-title {
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-top: 0.1rem;
        }

        .tab-sub {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .active-glow-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%);
        }

        .showcase-terminal-card {
          border-radius: var(--radius-lg);
          background: rgba(10, 22, 40, 0.88);
          border: 1px solid rgba(59, 130, 246, 0.22);
          box-shadow: 0 24px 60px -15px rgba(0, 0, 0, 0.7);
          overflow: hidden;
          margin-bottom: 2.5rem;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
        }

        .window-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .window-dot.red { background-color: #EF4444; opacity: 0.8; }
        .window-dot.yellow { background-color: #F59E0B; opacity: 0.8; }
        .window-dot.green { background-color: #10B981; opacity: 0.8; }

        .terminal-title {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #94A3B8;
          margin-left: 0.35rem;
        }

        .terminal-canvas {
          padding: 2.25rem;
        }

        .stage-meta-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 1.75rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          flex-wrap: wrap;
        }

        .meta-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          color: #22D3EE;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .stage-heading {
          font-size: 1.35rem;
          color: #FFFFFF;
          margin-bottom: 0.35rem;
        }

        .stage-desc {
          font-size: 0.92rem;
          color: #94A3B8;
          max-width: 720px;
          line-height: 1.55;
          margin: 0;
        }

        .stage-action-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--accent-cyan-light);
          text-decoration: none;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-sm);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          transition: all 0.2s ease;
        }

        .stage-action-link:hover {
          background: rgba(6, 182, 212, 0.2);
          border-color: rgba(6, 182, 212, 0.45);
        }

        .confidence-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: #CBD5E1;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-pill);
        }

        .officer-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-pill);
        }

        /* Intake Grid */
        .intake-form-mock-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .mock-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .mock-form-field label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .mock-input-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.95rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: #FFFFFF;
        }

        .mock-form-field small {
          font-size: 0.72rem;
          color: #64748B;
        }

        /* OCR Ingestion Preview */
        .ocr-preview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .ocr-doc-card {
          padding: 1.25rem;
          background: rgba(15, 31, 53, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: var(--radius-md);
        }

        .doc-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .doc-type-tag {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          color: #38BDF8;
        }

        .extracted-fields-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .extracted-field {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
          font-size: 0.82rem;
        }

        .extracted-field .k {
          font-family: var(--font-mono);
          color: #94A3B8;
        }

        .extracted-field .v {
          color: #FFFFFF;
          text-align: right;
        }

        /* Verification Matrix Table */
        .matrix-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
        }

        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .matrix-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #94A3B8;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }

        .matrix-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          color: #E2E8F0;
        }

        .matrix-table tr.row-flagged {
          background: rgba(245, 158, 11, 0.08);
        }

        /* Officer Review / Sanction */
        .officer-review-actions-panel {
          padding: 1.5rem;
          background: rgba(15, 31, 53, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
        }

        .review-notes-box {
          padding: 1rem;
          background: var(--bg-card);
          border-left: 3px solid #06B6D4;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
        }

        .review-action-buttons {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .digital-sanction-card {
          padding: 1.5rem;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
        }

        .sanction-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .sanction-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .s-label {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: #94A3B8;
          display: block;
          margin-bottom: 0.2rem;
        }

        .s-val {
          font-size: 0.9rem;
          color: #FFFFFF;
        }

        /* Footer Callout */
        .stage-footer-callout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.95rem 1.25rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          gap: 1rem;
          flex-wrap: wrap;
        }

        .showcase-bottom-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* Light Theme Overrides */
        [data-theme="light"] .showcase-terminal-card {
          background: #FFFFFF;
          border-color: rgba(148, 163, 184, 0.3);
          box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.1);
        }

        [data-theme="light"] .terminal-header {
          background: #F8FAFC;
          border-bottom-color: #E2E8F0;
        }

        [data-theme="light"] .terminal-title {
          color: #475569;
        }

        [data-theme="light"] .pipeline-tab-btn {
          background: #FFFFFF;
          border-color: #E2E8F0;
        }

        [data-theme="light"] .pipeline-tab-btn.active {
          background: #EFF6FF;
          border-color: #3B82F6;
          box-shadow: 0 4px 16px -2px rgba(37, 99, 235, 0.18);
        }

        [data-theme="light"] .tab-title {
          color: #0F172A;
        }

        [data-theme="light"] .stage-heading {
          color: #0F172A;
        }

        [data-theme="light"] .stage-desc {
          color: #475569;
        }

        [data-theme="light"] .mock-input-box {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        [data-theme="light"] .ocr-doc-card {
          background: #F8FAFC;
          border-color: #E2E8F0;
        }

        [data-theme="light"] .extracted-field .v {
          color: #0F172A;
        }

        [data-theme="light"] .matrix-table th {
          color: #475569 !important;
          border-bottom-color: #E2E8F0 !important;
        }

        [data-theme="light"] .matrix-table td {
          color: #1E293B !important;
          border-bottom-color: #E2E8F0 !important;
        }

        [data-theme="light"] .matrix-table tr.row-flagged {
          background: #FEF3C7 !important;
        }

        [data-theme="light"] .doc-type-tag {
          color: #0284C7 !important;
        }

        [data-theme="light"] .extracted-field .k {
          color: #475569 !important;
        }

        [data-theme="light"] .digital-sanction-card {
          background: #F0FDF4 !important;
          border-color: #86EFAC !important;
        }

        [data-theme="light"] .sanction-banner {
          border-bottom-color: #BBF7D0 !important;
        }

        [data-theme="light"] .sanction-banner strong {
          color: #0F172A !important;
        }

        [data-theme="light"] .sanction-banner span {
          color: #475569 !important;
        }

        [data-theme="light"] .s-label {
          color: #64748B !important;
        }

        [data-theme="light"] .s-val {
          color: #0F172A !important;
        }

        [data-theme="light"] .officer-review-actions-panel {
          background: #F8FAFC;
          border-color: #E2E8F0;
        }

        [data-theme="light"] .review-notes-box {
          background: #FFFFFF;
          border-left-color: #0284C7;
        }

        [data-theme="light"] .review-notes-box h4 {
          color: #0F172A !important;
        }

        [data-theme="light"] .review-notes-box p {
          color: #334155 !important;
        }

        [data-theme="light"] .stage-footer-callout {
          background: #F8FAFC;
          border-color: #E2E8F0;
        }

        [data-theme="light"] .stage-footer-callout span {
          color: #334155 !important;
        }

        @media (max-width: 1024px) {
          .pipeline-tab-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .intake-form-mock-grid {
            grid-template-columns: 1fr;
          }
          .ocr-preview-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .pipeline-tab-strip {
            grid-template-columns: 1fr;
          }
          .terminal-canvas {
            padding: 1.25rem;
          }
          .sanction-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default ScrollExpandSection;
