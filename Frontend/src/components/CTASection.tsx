import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10, paddingBottom: '7rem' }}>
      <div className="container">
        <div className="cta-banner hover-lift glow-border-accent">
          {/* Subtle Ambient Radial Glow */}
          <div className="cta-ambient-glow" />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto' }}>
            <div
              className="section-eyebrow shimmer-badge"
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                borderColor: 'rgba(6, 182, 212, 0.35)',
                color: '#22D3EE',
                marginBottom: '1.25rem'
              }}
            >
              <Sparkles size={13} />
              GET STARTED TODAY
            </div>

            <h2 className="cta-title">
              Ready to simplify your next application?
            </h2>

            <p className="cta-desc">
              Explore government services and see how GovEaseAI can guide you through the application process.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/services"
                className="btn btn-primary hover-lift"
                style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}
              >
                Explore Services <ArrowRight size={17} />
              </Link>

              <Link
                to="/login"
                className="btn btn-secondary hover-lift"
                style={{ padding: '0.85rem 1.65rem', fontSize: '1rem' }}
              >
                Get Started <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cta-banner {
          position: relative;
          text-align: center;
          background: linear-gradient(135deg, rgba(12, 28, 52, 0.95) 0%, rgba(7, 18, 33, 0.95) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-xl);
          padding: 4.5rem 2rem;
          overflow: hidden;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.65);
        }

        .cta-title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          color: #FFFFFF;
          margin-bottom: 1rem;
        }

        .cta-desc {
          font-size: 1.1rem;
          color: #CBD5E1;
          line-height: 1.6;
          margin-bottom: 2.25rem;
        }

        .cta-ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 300px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 75%);
          filter: blur(40px);
          pointer-events: none;
        }

        /* Light Mode Specific Overrides */
        [data-theme="light"] .cta-banner {
          background: linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%) !important;
          border-color: rgba(37, 99, 235, 0.35) !important;
          box-shadow: 0 20px 45px -10px rgba(37, 99, 235, 0.12) !important;
        }

        [data-theme="light"] .cta-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .cta-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .cta-ambient-glow {
          background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.06) 50%, transparent 75%) !important;
        }
      `}</style>
    </section>
  );
};

export default CTASection;
