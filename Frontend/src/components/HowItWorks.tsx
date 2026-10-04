import React from 'react';
import {
  Compass,
  FileEdit,
  UploadCloud,
  Cpu,
  CheckCircle2,
  LineChart,
  Sparkles
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Choose a Service',
      desc: 'Browse government services, read eligibility guidelines, and review statutory prerequisites before applying.',
      icon: Compass,
      tag: 'Discovery'
    },
    {
      num: '02',
      title: 'Complete Application',
      desc: 'Fill in essential applicant and business details through an intuitive, structured digital questionnaire.',
      icon: FileEdit,
      tag: 'Intake'
    },
    {
      num: '03',
      title: 'Upload Documents',
      desc: 'Upload required identity certificates, property deeds, and technical blueprints in PDF or image format.',
      icon: UploadCloud,
      tag: 'Upload'
    },
    {
      num: '04',
      title: 'AI-Assisted Processing',
      desc: 'Documents are processed via OCR to extract key fields and cross-match applicant data for instant consistency review.',
      icon: Cpu,
      tag: 'AI-Assisted',
      isAi: true
    },
    {
      num: '05',
      title: 'Review & Submit',
      desc: 'Examine extracted values, address highlighted verification warnings, and finalize submission with full transparency.',
      icon: CheckCircle2,
      tag: 'Citizen Review'
    },
    {
      num: '06',
      title: 'Track Application',
      desc: 'Follow your application through municipal departmental review, field inspection, and authorized officer sanction.',
      icon: LineChart,
      tag: 'Transparency'
    }
  ];

  return (
    <section id="how-it-works" className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow shimmer-badge">
            <Sparkles size={13} />
            END-TO-END WORKFLOW
          </div>
          <h2>How GovEaseAI Works</h2>
          <p className="section-subtitle">
            From service discovery to application tracking, the platform guides citizens through every step.
          </p>
        </div>

        {/* 6-Step Visual Timeline Grid */}
        <div className="timeline-grid">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`glass-panel timeline-step-card hover-lift glow-border-accent ${step.isAi ? 'ai-highlighted' : ''}`}
              >
                {/* Step Number & Badge */}
                <div className="step-card-header">
                  <span className="step-number">{step.num}</span>
                  <span
                    className={`badge ${step.isAi ? 'badge-info' : 'badge-neutral'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {step.isAi && <Sparkles size={10} style={{ marginRight: '3px' }} />}
                    {step.tag}
                  </span>
                </div>

                {/* Icon & Details */}
                <div className="step-icon-wrapper">
                  <Icon size={24} color={step.isAi ? '#22D3EE' : '#60A5FA'} />
                </div>

                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>

                {/* Connection Arrow for Desktop (Except Last Step) */}
                {idx < steps.length - 1 && (
                  <div className="step-connector" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .timeline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          position: relative;
        }

        .timeline-step-card {
          padding: 2rem;
          position: relative;
          display: flex;
          flex-direction: column;
          background: rgba(10, 23, 40, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .timeline-step-card.ai-highlighted {
          background: rgba(8, 28, 52, 0.85);
          border-color: rgba(6, 182, 212, 0.38);
          box-shadow: 0 0 28px -5px rgba(6, 182, 212, 0.2);
        }

        .step-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .step-number {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.35);
          line-height: 1;
        }

        .ai-highlighted .step-number {
          color: rgba(34, 211, 238, 0.55);
        }

        .step-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .ai-highlighted .step-icon-wrapper {
          background: rgba(6, 182, 212, 0.12);
          border-color: rgba(6, 182, 212, 0.35);
        }

        .step-title {
          font-size: 1.2rem;
          color: #FFFFFF;
          margin-bottom: 0.65rem;
        }

        .step-desc {
          font-size: 0.925rem;
          color: #94A3B8;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .timeline-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .timeline-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
