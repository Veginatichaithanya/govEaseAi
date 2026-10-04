import React from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Circle,
  FileText,
  ShieldCheck,
  Building
} from 'lucide-react';
import { MOCK_TRACKING_SAMPLE } from '../mock/services';

export const TrackingPreview: React.FC = () => {
  const tracking = MOCK_TRACKING_SAMPLE;

  return (
    <section className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow shimmer-badge">
            <Search size={13} />
            TRANSPARENT APPLICATION AUDIT
          </div>
          <h2>Real-Time Application Tracking</h2>
          <p className="section-subtitle">
            Never wonder where your file is stuck. Citizens receive full visibility across each
            verification gate and officer evaluation stage.
          </p>
        </div>

        {/* Tracking Card */}
        <div className="glass-panel tracking-card-container hover-lift glow-border-accent">
          {/* Card Header */}
          <div className="tracking-header">
            <div className="tracking-title-block">
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem', marginBottom: '0.45rem' }}>
                PROTOTYPE MOCK DATA
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Building size={20} color="#38BDF8" />
                <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                  {tracking.serviceName}
                </h3>
              </div>
            </div>

            <div className="tracking-token-block">
              <span className="token-label">APPLICATION NUMBER</span>
              <span className="token-code">{tracking.applicationNumber}</span>
              <span className="badge badge-info" style={{ marginTop: '0.35rem', fontSize: '0.72rem' }}>
                Status: {tracking.overallStatus}
              </span>
            </div>
          </div>

          {/* Timeline Visual */}
          <div className="tracking-body">
            <div className="timeline-stepper">
              {tracking.stages.map((stage) => {
                const isCompleted = stage.status === 'completed';
                const isCurrent = stage.status === 'current';

                return (
                  <div key={stage.id} className={`stepper-node ${stage.status}`}>
                    {/* Circle / Icon */}
                    <div className="node-icon-box">
                      {isCompleted && <CheckCircle2 size={18} color="#10B981" />}
                      {isCurrent && <Clock size={18} color="#22D3EE" />}
                      {!isCompleted && !isCurrent && <Circle size={18} color="#64748B" />}
                    </div>

                    {/* Stage Content */}
                    <div className="node-details">
                      <div className="node-title-row">
                        <span className="node-title">{stage.title}</span>
                        {stage.badge && (
                          <span
                            className={`badge ${
                              stage.badge.includes('AI') ? 'badge-info' : 'badge-success'
                            }`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {stage.badge}
                          </span>
                        )}
                      </div>
                      <p className="node-desc">{stage.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Applicant & Audit Metadata Summary */}
            <div className="tracking-audit-sidebar">
              <div className="sidebar-header">
                <FileText size={16} color="#60A5FA" />
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#FFFFFF' }}>
                  Intake Dossier Metadata
                </span>
              </div>

              <div className="meta-pairs">
                <div className="meta-pair">
                  <span className="meta-key">Applicant</span>
                  <span className="meta-val">{tracking.applicantName}</span>
                </div>
                <div className="meta-pair">
                  <span className="meta-key">Submission Date</span>
                  <span className="meta-val">{tracking.submissionDate}</span>
                </div>
                <div className="meta-pair">
                  <span className="meta-key">Current Stage</span>
                  <span className="meta-val" style={{ color: '#22D3EE' }}>
                    {tracking.currentStage}
                  </span>
                </div>
                <div className="meta-pair">
                  <span className="meta-key">Assigned Dept</span>
                  <span className="meta-val">MAUD Ward 10 Licensing Desk</span>
                </div>
              </div>

              <div className="audit-disclaimer">
                <ShieldCheck size={14} color="#94A3B8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  This application timeline is a mock prototype presentation for research demonstration.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tracking-card-container {
          background: rgba(10, 22, 39, 0.88);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .tracking-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .token-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: #64748B;
          letter-spacing: 0.05em;
          display: block;
        }

        .token-code {
          font-family: var(--font-mono);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--accent-cyan-light);
          display: block;
        }

        .tracking-body {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 2rem;
          padding: 2rem;
        }

        .timeline-stepper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
        }

        .timeline-stepper::before {
          content: '';
          position: absolute;
          top: 14px;
          bottom: 14px;
          left: 13px;
          width: 2px;
          background: rgba(148, 163, 184, 0.15);
          z-index: 0;
        }

        .stepper-node {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .node-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        .stepper-node.current .node-icon-box {
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.35);
        }

        .node-details {
          flex: 1;
          padding: 0.2rem 0;
        }

        .node-title-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.2rem;
        }

        .node-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 600;
          color: #FFFFFF;
        }

        .stepper-node.pending .node-title {
          color: #64748B;
        }

        .node-desc {
          font-size: 0.825rem;
          color: #94A3B8;
          line-height: 1.45;
          margin: 0;
        }

        .tracking-audit-sidebar {
          background: rgba(15, 31, 53, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          margin-bottom: 1.15rem;
        }

        .meta-pairs {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .meta-pair {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .meta-key {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: #64748B;
          text-transform: uppercase;
        }

        .meta-val {
          font-size: 0.875rem;
          font-weight: 600;
          color: #E2E8F0;
        }

        .audit-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.65rem 0.85rem;
          background: rgba(0, 0, 0, 0.25);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(148, 163, 184, 0.08);
        }

        @media (max-width: 900px) {
          .tracking-body {
            grid-template-columns: 1fr;
          }
        }

        /* Light Mode Specific Overrides */
        [data-theme="light"] .tracking-card-container {
          background: #FFFFFF !important;
          border-color: #E2E8F0 !important;
          box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.08) !important;
        }

        [data-theme="light"] .tracking-header {
          background: #F8FAFC !important;
          border-bottom-color: #E2E8F0 !important;
        }

        [data-theme="light"] .tracking-title-block h3 {
          color: #0F172A !important;
        }

        [data-theme="light"] .token-code {
          color: #0284C7 !important;
        }

        [data-theme="light"] .token-label {
          color: #64748B !important;
        }

        [data-theme="light"] .node-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .node-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .stepper-node.pending .node-title {
          color: #94A3B8 !important;
        }

        [data-theme="light"] .tracking-audit-sidebar {
          background: #F8FAFC !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .sidebar-header strong {
          color: #0F172A !important;
        }

        [data-theme="light"] .meta-key {
          color: #64748B !important;
        }

        [data-theme="light"] .meta-val {
          color: #0F172A !important;
        }

        [data-theme="light"] .audit-disclaimer {
          background: #EFF6FF !important;
          border-color: #BFDBFE !important;
        }

        [data-theme="light"] .audit-disclaimer span {
          color: #1E3A8A !important;
        }
      `}</style>
    </section>
  );
};

export default TrackingPreview;
