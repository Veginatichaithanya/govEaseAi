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
                className="glass-panel hover-lift glow-border-accent"
                style={{
                  padding: '1.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(10, 23, 41, 0.65)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                    marginBottom: '1.15rem'
                  }}
                >
                  <Icon size={20} />
                </div>

                <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', marginBottom: '0.65rem' }}>
                  {topic.title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                  {topic.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Scientific Integrity Notice */}
        <div
          style={{
            textAlign: 'center',
            padding: '1.25rem 2rem',
            background: 'rgba(15, 31, 53, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '850px',
            margin: '0 auto'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#94A3B8',
              lineHeight: 1.6
            }}
          >
            <strong>Research Methodology Note:</strong> This platform is designed strictly for academic demonstration and system evaluation. It makes no claims of unverified empirical accuracy or comparative superiority over existing e-governance infrastructures.
          </span>
        </div>
      </div>
    </section>
  );
};

export default ResearchSection;
