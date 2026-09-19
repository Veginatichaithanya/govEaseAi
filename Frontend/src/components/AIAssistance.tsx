import React from 'react';
import {
  FileSearch,
  CheckCheck,
  HelpCircle,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export const AIAssistance: React.FC = () => {
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
    <section className="section-wrapper" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div
            className="section-eyebrow"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#34D399'
            }}
          >
            <UserCheck size={13} />
            HUMAN-IN-THE-LOOP
          </div>
          <h2>AI That Assists — Not Decides</h2>
          <p className="section-subtitle">
            GovEaseAI uses AI to help citizens and officers process information faster,
            but final government decisions remain strictly under authorized human control.
          </p>
        </div>

        {/* 3 Core AI Assistance Cards */}
        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  background: 'rgba(11, 25, 44, 0.75)'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.accent
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'rgba(148, 163, 184, 0.3)'
                      }}
                    >
                      {card.num}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.85rem' }}>
                    {card.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: '#94A3B8',
                      lineHeight: 1.6,
                      marginBottom: '1.75rem'
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                    paddingTop: '1.25rem'
                  }}
                >
                  {card.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: '#CBD5E1',
                        background: 'rgba(15, 34, 58, 0.7)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Governance & Human-in-the-Loop Callout Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '1.75rem 2.25rem',
            background: 'linear-gradient(135deg, rgba(8, 28, 52, 0.9) 0%, rgba(12, 38, 70, 0.85) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', maxWidth: '800px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={24} color="#10B981" />
            </div>
            <div>
              <h4 style={{ color: '#FFFFFF', marginBottom: '0.25rem' }}>
                Ethical AI Governance Principle
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>
                GovEaseAI functions as an intelligence layer to reduce clerical overhead. The software
                never overrides, bypasses, or replaces the statutory discretion of designated government
                licensing officers.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#34D399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap'
            }}
          >
            Zero Automated Approvals
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistance;
