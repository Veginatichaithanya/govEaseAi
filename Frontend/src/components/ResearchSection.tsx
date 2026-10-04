import React from 'react';
import {
  GraduationCap,
  Layers,
  FileScan,
  ShieldCheck,
  Workflow,
  Search,
  CheckCircle
} from 'lucide-react';

export const ResearchSection: React.FC = () => {
  const topics = [
    {
      title: 'Multimodal Document Processing',
      description:
        'Investigating parsing techniques across heterogeneous citizen document layouts, scanned identity cards, and architectural blueprints.',
      icon: Layers
    },
    {
      title: 'OCR & Information Extraction',
      description:
        'Evaluating optical character recognition models to tokenize structured textual attributes from imperfect or skewed scans.',
      icon: FileScan
    },
    {
      title: 'AI-Assisted Verification Heuristics',
      description:
        'Designing deterministic and semantic cross-validation rules to detect conflicting fields between certificates and online submissions.',
      icon: CheckCircle
    },
    {
      title: 'Application Automation Frameworks',
      description:
        'Studying modern event-driven state pipelines to eliminate redundant administrative steps and duplicate data entry.',
      icon: Workflow
    },
    {
      title: 'Human-in-the-Loop Decision Governance',
      description:
        'Preserving constitutional administrative discretion by ensuring AI outputs act strictly as assistive recommendations for officers.',
      icon: ShieldCheck
    },
    {
      title: 'Transparent Citizen Audit Trails',
      description:
        'Exploring cryptographic accountability and granular stage tracking to build public trust in digital governance systems.',
      icon: Search
    }
  ];

  return (
    <section id="about" className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div
            className="section-eyebrow shimmer-badge"
            style={{
              background: 'rgba(96, 165, 250, 0.1)',
              borderColor: 'rgba(96, 165, 250, 0.28)',
              color: '#93C5FD'
            }}
          >
            <GraduationCap size={14} />
            ACADEMIC RESEARCH SCOPE
          </div>
          <h2>Built to Explore AI-Assisted Government Automation</h2>
          <p className="section-subtitle">
            GovEaseAI is developed as a final-year engineering prototype to study the technical feasibility,
            ethical boundaries, and procedural advantages of assistive artificial intelligence in public administration.
          </p>
        </div>

        {/* 6 Research Areas Grid */}
        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          {topics.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <div
                key={idx}
                className="glass-panel academic-research-card hover-lift glow-border-accent"
              >
                <div className="academic-icon-wrap">
                  <Icon size={20} />
                </div>

                <h3 className="academic-title">
                  {topic.title}
                </h3>

                <p className="academic-desc">
                  {topic.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Scientific Integrity Notice */}
        <div className="academic-notice-box">
          <span className="academic-notice-text">
            <strong>Research Methodology Note:</strong> This platform is designed strictly for academic demonstration and system evaluation. It makes no claims of unverified empirical accuracy or comparative superiority over existing e-governance infrastructures.
          </span>
        </div>
      </div>

      <style>{`
        .academic-research-card {
          padding: 1.85rem;
          display: flex;
          flex-direction: column;
          background: rgba(10, 23, 41, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: var(--radius-lg);
        }

        .academic-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60A5FA;
          margin-bottom: 1.15rem;
        }

        .academic-title {
          font-size: 1.1rem;
          color: #FFFFFF;
          margin-bottom: 0.65rem;
        }

        .academic-desc {
          font-size: 0.88rem;
          color: #94A3B8;
          line-height: 1.55;
          margin: 0;
        }

        .academic-notice-box {
          text-align: center;
          padding: 1.25rem 2rem;
          background: rgba(15, 31, 53, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: var(--radius-md);
          maxWidth: 850px;
          margin: 0 auto;
        }

        .academic-notice-text {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: #94A3B8;
          line-height: 1.6;
        }

        /* Light Mode Specific Overrides */
        [data-theme="light"] .academic-research-card {
          background: #FFFFFF !important;
          border-color: #E2E8F0 !important;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
        }

        [data-theme="light"] .academic-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .academic-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .academic-icon-wrap {
          background: #EFF6FF !important;
          border-color: #BFDBFE !important;
          color: #2563EB !important;
        }

        [data-theme="light"] .academic-notice-box {
          background: #F8FAFC !important;
          border-color: #E2E8F0 !important;
        }

        [data-theme="light"] .academic-notice-text {
          color: #475569 !important;
        }
      `}</style>
    </section>
  );
};

export default ResearchSection;
