import React, { useState } from 'react';
import {
  FileText,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const DocumentProcessing: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<'aadhaar' | 'lease'>('aadhaar');

  return (
    <section className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow shimmer-badge">
            <Cpu size={13} />
            DOCUMENT PROCESSING PIPELINE
          </div>
          <h2>Intelligent Document Extraction</h2>
          <p className="section-subtitle">
            Experience how GovEaseAI parses multi-page citizen documents, tokenizes identity attributes,
            and highlights discrepancies for human scrutiny.
          </p>
        </div>

        {/* Pipeline Architecture Indicator */}
        <div className="doc-pipeline-flow">
          <div className="flow-step">
            <span className="flow-num">1</span>
            <span className="flow-text">Uploaded Document</span>
          </div>
          <ArrowRight size={16} className="flow-arrow" />
          <div className="flow-step">
            <span className="flow-num">2</span>
            <span className="flow-text">AI Multimodal OCR</span>
          </div>
          <ArrowRight size={16} className="flow-arrow" />
          <div className="flow-step">
            <span className="flow-num">3</span>
            <span className="flow-text">Extracted Fields</span>
          </div>
          <ArrowRight size={16} className="flow-arrow" />
          <div className="flow-step active-flow">
            <span className="flow-num">4</span>
            <span className="flow-text">Heuristic Cross-Match</span>
          </div>
          <ArrowRight size={16} className="flow-arrow" />
          <div className="flow-step">
            <span className="flow-num">5</span>
            <span className="flow-text">Officer Scrutiny Desk</span>
          </div>
        </div>

        {/* Visual Product Demonstration Workspace */}
        <div className="glass-panel doc-demo-workspace hover-lift glow-border-accent">
          {/* Header Bar */}
          <div className="demo-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={18} color="#60A5FA" />
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>
                  Document Inspection: Trade License Application (GEAI-2026-000001)
                </span>
              </div>
            </div>

            {/* Document Switcher */}
            <div className="doc-switcher">
              <button
                className={`switcher-btn ${selectedDoc === 'aadhaar' ? 'active' : ''}`}
                onClick={() => setSelectedDoc('aadhaar')}
              >
                Identity Proof (Aadhaar)
              </button>
              <button
                className={`switcher-btn ${selectedDoc === 'lease' ? 'active' : ''}`}
                onClick={() => setSelectedDoc('lease')}
              >
                Premises Lease Agreement
              </button>
            </div>
          </div>

          {/* Interactive Inspection Grid */}
          <div className="demo-grid">
            {/* Left: Mock Document Preview */}
            <div className="doc-preview-pane">
              <div className="pane-header">
                <span className="pane-title">ORIGINAL DOCUMENT PROOF</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                  PDF • 1.2 MB
                </span>
              </div>

              <div className="mock-document-sheet">
                {selectedDoc === 'aadhaar' ? (
                  <div className="document-sheet-content">
                    <div className="doc-stamp">OFFICIAL IDENTIFIER</div>
                    <div className="doc-header-row">
                      <div className="doc-emblem" />
                      <div style={{ flex: 1 }}>
                        <div className="doc-line thick" style={{ width: '60%' }} />
                        <div className="doc-line" style={{ width: '40%' }} />
                      </div>
                    </div>

                    <div className="doc-body-fields">
                      <div className="doc-field-block">
                        <span className="field-caption">NAME / नाम</span>
                        <div className="field-value-box highlight-field">Ravi Kumar</div>
                      </div>

                      <div className="doc-field-block">
                        <span className="field-caption">IDENTIFICATION NO. / विशिष्ट संख्या</span>
                        <div className="field-value-box">XXXX - XXXX - 1234</div>
                      </div>

                      <div className="doc-field-block">
                        <span className="field-caption">PERMANENT ADDRESS / स्थायी पता</span>
                        <div className="field-value-box warning-field">
                          Plot 42, Road 10, Jubilee Hills, Hyderabad 500033
                        </div>
                      </div>
                    </div>

                    <div className="doc-footer-row">
                      <div className="doc-qr-mock" />
                      <div style={{ flex: 1 }}>
                        <div className="doc-line" style={{ width: '75%' }} />
                        <div className="doc-line" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="document-sheet-content">
                    <div className="doc-stamp">COMMERCIAL LEASE</div>
                    <div className="doc-header-row">
                      <div className="doc-emblem" style={{ background: '#475569' }} />
                      <div style={{ flex: 1 }}>
                        <div className="doc-line thick" style={{ width: '70%' }} />
                        <div className="doc-line" style={{ width: '45%' }} />
                      </div>
                    </div>

                    <div className="doc-body-fields">
                      <div className="doc-field-block">
                        <span className="field-caption">LESSEE NAME / किरायेदार</span>
                        <div className="field-value-box highlight-field">Ravi Kumar (Sole Prop.)</div>
                      </div>

                      <div className="doc-field-block">
                        <span className="field-caption">COMMERCIAL PREMISES ADDRESS</span>
                        <div className="field-value-box">
                          Shop No. 4, Commercial Complex, Jubilee Hills, Hyderabad
                        </div>
                      </div>

                      <div className="doc-field-block">
                        <span className="field-caption">CARPET AREA / क्षेत्रफल</span>
                        <div className="field-value-box">650 sq ft (Ground Floor)</div>
                      </div>
                    </div>

                    <div className="doc-footer-row">
                      <div className="doc-qr-mock" />
                      <div style={{ flex: 1 }}>
                        <div className="doc-line" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI Extraction & Verification Analysis */}
            <div className="doc-extraction-pane">
              <div className="pane-header">
                <span className="pane-title">EXTRACTED ATTRIBUTES & VERIFICATION</span>
                <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                  <Sparkles size={10} style={{ marginRight: '3px' }} />
                  AI-assisted result
                </span>
              </div>

              {/* Extraction Comparison Table */}
              <div className="extraction-table">
                {selectedDoc === 'aadhaar' ? (
                  <>
                    <div className="table-row">
                      <div className="col-field">
                        <span className="table-label">Applicant Name</span>
                        <span className="form-val">Form: Ravi Kumar</span>
                      </div>
                      <div className="col-extracted">
                        <span className="extracted-val">OCR: Ravi Kumar</span>
                      </div>
                      <div className="col-status">
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Match
                        </span>
                      </div>
                    </div>

                    <div className="table-row">
                      <div className="col-field">
                        <span className="table-label">ID Number</span>
                        <span className="form-val">Form: XXXX-XXXX-1234</span>
                      </div>
                      <div className="col-extracted">
                        <span className="extracted-val">OCR: XXXX-XXXX-1234</span>
                      </div>
                      <div className="col-status">
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Valid Format
                        </span>
                      </div>
                    </div>

                    <div className="table-row warning-highlight">
                      <div className="col-field">
                        <span className="table-label">Address</span>
                        <span className="form-val">Form: Flat 42B, Road 10, Jubilee Hills</span>
                      </div>
                      <div className="col-extracted">
                        <span className="extracted-val">OCR: Plot 42, Road 10, Jubilee Hills</span>
                      </div>
                      <div className="col-status">
                        <span className="badge badge-warning">
                          <AlertTriangle size={12} /> Review Required
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="table-row">
                      <div className="col-field">
                        <span className="table-label">Tenant Name</span>
                        <span className="form-val">Form: Ravi Kumar</span>
                      </div>
                      <div className="col-extracted">
                        <span className="extracted-val">OCR: Ravi Kumar (Sole Prop.)</span>
                      </div>
                      <div className="col-status">
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Entity Match
                        </span>
                      </div>
                    </div>

                    <div className="table-row">
                      <div className="col-field">
                        <span className="table-label">Commercial Area</span>
                        <span className="form-val">Form: 650 sq ft</span>
                      </div>
                      <div className="col-extracted">
                        <span className="extracted-val">OCR: 650 sq ft</span>
                      </div>
                      <div className="col-status">
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Disclaimer Notice */}
              <div className="demo-disclaimer-box">
                <ShieldAlert size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.775rem', color: '#CBD5E1', lineHeight: 1.45 }}>
                  <strong style={{ color: '#FBBF24' }}>AI-Assisted Result Notice:</strong> The automated
                  findings displayed above represent heuristic character extraction. These are flagged for
                  review only and do not constitute legal verification or approval.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .doc-pipeline-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          margin-bottom: 2.75rem;
          flex-wrap: wrap;
        }

        .flow-step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.95rem;
          background: rgba(15, 34, 58, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: var(--radius-pill);
        }

        .flow-step.active-flow {
          background: rgba(6, 182, 212, 0.15);
          border-color: rgba(6, 182, 212, 0.45);
        }

        .flow-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .active-flow .flow-num {
          background: #06B6D4;
          color: #07111F;
        }

        .flow-text {
          font-family: var(--font-display);
          font-size: 0.82rem;
          font-weight: 600;
          color: #CBD5E1;
        }

        .flow-arrow {
          color: #64748B;
        }

        .doc-demo-workspace {
          background: rgba(10, 22, 39, 0.88);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .demo-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.75rem;
          background: rgba(7, 17, 31, 0.7);
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .doc-switcher {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .switcher-btn {
          font-family: var(--font-display);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-sm);
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.2s ease;
        }

        .switcher-btn.active {
          color: #FFFFFF;
          background: rgba(59, 130, 246, 0.22);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 2rem;
          padding: 1.75rem;
        }

        .doc-preview-pane, .doc-extraction-pane {
          display: flex;
          flex-direction: column;
        }

        .pane-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
        }

        .pane-title {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94A3B8;
        }

        .mock-document-sheet {
          background: #0D1B2E;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        .doc-stamp {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          color: #38BDF8;
          border: 1px dashed rgba(56, 189, 248, 0.5);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .doc-header-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .doc-emblem {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2563EB;
        }

        .doc-line {
          height: 6px;
          background: rgba(148, 163, 184, 0.25);
          border-radius: 3px;
          margin-bottom: 4px;
        }

        .doc-line.thick {
          height: 9px;
          background: rgba(148, 163, 184, 0.45);
        }

        .doc-body-fields {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .field-caption {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: #64748B;
          display: block;
          margin-bottom: 0.2rem;
        }

        .field-value-box {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: #FFFFFF;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.4rem 0.65rem;
          border-radius: 4px;
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .field-value-box.highlight-field {
          border-color: rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.08);
        }

        .field-value-box.warning-field {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.1);
        }

        .doc-footer-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .doc-qr-mock {
          width: 28px;
          height: 28px;
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }

        .extraction-table {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1.3fr 1.3fr 1fr;
          gap: 0.75rem;
          align-items: center;
          padding: 0.85rem 1rem;
          background: rgba(15, 31, 53, 0.55);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: var(--radius-sm);
        }

        .table-row.warning-highlight {
          background: rgba(245, 158, 11, 0.06);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .table-label {
          font-family: var(--font-display);
          font-size: 0.825rem;
          font-weight: 600;
          color: #FFFFFF;
          display: block;
        }

        .form-val {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #94A3B8;
          display: block;
        }

        .extracted-val {
          font-family: var(--font-mono);
          font-size: 0.76rem;
          color: #38BDF8;
          display: block;
        }

        .demo-disclaimer-box {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-sm);
        }

        @media (max-width: 900px) {
          .demo-grid {
            grid-template-columns: 1fr;
          }
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }

        /* Light Mode Specific Overrides */
        [data-theme="light"] .flow-step {
          background: #FFFFFF !important;
          border-color: #CBD5E1 !important;
        }

        [data-theme="light"] .flow-text {
          color: #334155 !important;
        }

        [data-theme="light"] .flow-step.active-flow {
          background: #EFF6FF !important;
          border-color: #3B82F6 !important;
        }

        [data-theme="light"] .doc-demo-workspace {
          background: #FFFFFF !important;
          border-color: #E2E8F0 !important;
          box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.08) !important;
        }

        [data-theme="light"] .demo-header-bar {
          background: #F8FAFC !important;
          border-bottom-color: #E2E8F0 !important;
        }

        [data-theme="light"] .demo-header-bar span {
          color: #0F172A !important;
        }

        [data-theme="light"] .switcher-btn {
          background: #FFFFFF !important;
          border-color: #CBD5E1 !important;
          color: #475569 !important;
        }

        [data-theme="light"] .switcher-btn.active {
          background: #EFF6FF !important;
          border-color: #3B82F6 !important;
          color: #1D4ED8 !important;
        }

        [data-theme="light"] .mock-document-sheet {
          background: #F8FAFC !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .doc-stamp {
          color: #0284C7 !important;
          border-color: rgba(2, 132, 199, 0.5) !important;
        }

        [data-theme="light"] .field-value-box {
          background: #FFFFFF !important;
          border-color: #CBD5E1 !important;
          color: #0F172A !important;
        }

        [data-theme="light"] .field-value-box.highlight-field {
          background: #F0FDF4 !important;
          border-color: #86EFAC !important;
        }

        [data-theme="light"] .field-value-box.warning-field {
          background: #FFFBEB !important;
          border-color: #FDE68A !important;
        }

        [data-theme="light"] .table-row {
          background: #F8FAFC !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .table-row.warning-highlight {
          background: #FFFBEB !important;
          border-color: #FDE68A !important;
        }

        [data-theme="light"] .table-label {
          color: #0F172A !important;
        }

        [data-theme="light"] .form-val {
          color: #475569 !important;
        }

        [data-theme="light"] .extracted-val {
          color: #0284C7 !important;
        }

        [data-theme="light"] .demo-disclaimer-box {
          background: #FFFBEB !important;
          border-color: #FDE68A !important;
        }

        [data-theme="light"] .demo-disclaimer-box div {
          color: #78350F !important;
        }
      `}</style>
    </section>
  );
};

export default DocumentProcessing;
