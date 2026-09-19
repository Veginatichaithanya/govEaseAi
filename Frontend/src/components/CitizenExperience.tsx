import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  FileCheck,
  UploadCloud,
  CheckCircle,
  Clock,
  ArrowRight,
  User
} from 'lucide-react';

export const CitizenExperience: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Find Services',
      desc: 'Quickly search municipal, labour, and environmental permits through a unified catalog.',
      icon: Search
    },
    {
      num: '2',
      title: 'Understand Requirements',
      desc: 'Transparent checklist of eligibility criteria and fee calculations before filling out paperwork.',
      icon: BookOpen
    },
    {
      num: '3',
      title: 'Complete Application',
      desc: 'Guided step-by-step form with contextual field validations to minimize intake mistakes.',
      icon: FileCheck
    },
    {
      num: '4',
      title: 'Upload Documents',
      desc: 'Direct drag-and-drop ingestion of proofs with instantaneous file format checking.',
      icon: UploadCloud
    },
    {
      num: '5',
      title: 'Review Information',
      desc: 'Inspect AI-assisted extraction side-by-side with submitted data and make necessary edits.',
      icon: CheckCircle
    },
    {
      num: '6',
      title: 'Track Status',
      desc: 'Transparent tracking dashboard displaying the exact departmental desk handling your file.',
      icon: Clock
    }
  ];

  return (
    <section className="section-wrapper" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <User size={13} />
            CITIZEN-FIRST ARCHITECTURE
          </div>
          <h2>Designed Around the Citizen</h2>
          <p className="section-subtitle">
            Say goodbye to confusing physical offices, opaque token queues, and repeated clerical visits.
            GovEaseAI provides a transparent, intuitive digital journey from start to finish.
          </p>
        </div>

        {/* 6 Step Journey Grid */}
        <div className="citizen-journey-grid" style={{ marginBottom: '3rem' }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="glass-panel citizen-card">
                <div className="citizen-step-indicator">
                  <span className="step-circle">{step.num}</span>
                  <div className="citizen-icon-box">
                    <Icon size={18} color="#38BDF8" />
                  </div>
                </div>

                <h3 className="citizen-card-title">{step.title}</h3>
                <p className="citizen-card-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/services"
            className="btn btn-primary"
            style={{
              padding: '0.85rem 2.25rem',
              fontSize: '1rem',
              gap: '0.65rem'
            }}
          >
            Explore Services <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <style>{`
        .citizen-journey-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
        }

        .citizen-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          background: rgba(11, 24, 43, 0.72);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .citizen-step-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .step-circle {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 700;
          color: #94A3B8;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .citizen-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .citizen-card-title {
          font-size: 1.15rem;
          color: #FFFFFF;
          margin-bottom: 0.65rem;
        }

        .citizen-card-desc {
          font-size: 0.9rem;
          color: #94A3B8;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .citizen-journey-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .citizen-journey-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default CitizenExperience;
