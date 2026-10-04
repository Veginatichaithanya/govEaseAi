import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Layers,
  Sparkles,
  Clock,
  Coins,
  FileCheck2
} from 'lucide-react';
import { MOCK_SERVICES } from '../mock/services';

const iconMap = {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck
};

export const ServicePreview: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Business', 'Construction', 'Industry', 'Environment'];

  const filteredServices = selectedCategory === 'All'
    ? MOCK_SERVICES
    : MOCK_SERVICES.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section id="services" className="section-wrapper reveal-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow shimmer-badge">
            <Layers size={13} />
            STATUTORY SERVICE DIRECTORY
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>Available Government Services</h2>
          <p className="section-subtitle">
            Explore statutory municipal licenses, industrial permits, and building permissions
            with automated prerequisites and AI-assisted intake.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="service-category-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat === 'All' ? 'All Services' : cat}
            </button>
          ))}
        </div>

        {/* 6 Service Cards Grid */}
        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          {filteredServices.map((service) => {
            const IconComponent = iconMap[service.iconName] || Building;

            return (
              <div
                key={service.id}
                className="glass-panel service-card hover-lift glow-border-accent"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.85rem',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                {/* Top Subtle Accent Bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%)',
                    opacity: 0.85
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-blue-light)'
                      }}
                    >
                      <IconComponent size={22} strokeWidth={2} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.2rem',
                      marginBottom: '0.25rem',
                      color: '#FFFFFF'
                    }}
                  >
                    {service.name}
                  </h3>

                  <div
                    style={{
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-cyan-light)',
                      marginBottom: '0.85rem'
                    }}
                  >
                    {service.department}
                  </div>

                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: '#94A3B8',
                      lineHeight: 1.55,
                      marginBottom: '1.25rem'
                    }}
                  >
                    {service.shortDescription}
                  </p>

                  {/* Micro Metadata Strip */}
                  <div className="service-card-meta-chips">
                    <div className="meta-chip">
                      <Clock size={12} color="#60A5FA" />
                      <span>{service.processingTime || service.estimatedTime}</span>
                    </div>
                    <div className="meta-chip">
                      <Coins size={12} color="#F59E0B" />
                      <span>{service.fee}</span>
                    </div>
                    <div className="meta-chip">
                      <FileCheck2 size={12} color="#10B981" />
                      <span>{service.requiredDocuments?.length || 3} Proofs Required</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Links */}
                <div
                  style={{
                    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                    paddingTop: '1.15rem',
                    marginTop: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <Link
                    to={`/services/${service.id}`}
                    className="service-link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Prerequisites <ChevronRight size={14} />
                  </Link>

                  <Link
                    to={`/services/${service.id}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.78rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <Sparkles size={12} /> Apply with AI
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Services CTA Button */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/services"
            className="btn btn-secondary hover-lift"
            style={{
              padding: '0.85rem 2.25rem',
              fontSize: '0.98rem',
              gap: '0.65rem'
            }}
          >
            Explore Complete Service Catalog <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <style>{`
        .service-category-filter-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .cat-pill-btn {
          font-family: var(--font-display);
          font-size: 0.84rem;
          font-weight: 600;
          padding: 0.45rem 1.15rem;
          border-radius: var(--radius-pill);
          color: #94A3B8;
          background: rgba(12, 28, 52, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cat-pill-btn:hover {
          color: #FFFFFF;
          border-color: rgba(6, 182, 212, 0.4);
          background: rgba(16, 38, 70, 0.8);
        }

        .cat-pill-btn.active {
          color: #FFFFFF;
          background: rgba(6, 182, 212, 0.2);
          border-color: rgba(6, 182, 212, 0.55);
          box-shadow: 0 0 16px -2px rgba(6, 182, 212, 0.3);
        }

        .service-card-meta-chips {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-mono);
          font-size: 0.74rem;
          color: #CBD5E1;
        }

        /* Light Theme Overrides */
        [data-theme="light"] .cat-pill-btn {
          background: #FFFFFF;
          border-color: #E2E8F0;
          color: #475569;
        }

        [data-theme="light"] .cat-pill-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        [data-theme="light"] .cat-pill-btn.active {
          background: #EFF6FF;
          border-color: #3B82F6;
          color: #1D4ED8;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
        }

        [data-theme="light"] .service-card h3 {
          color: #0F172A !important;
        }

        [data-theme="light"] .meta-chip {
          color: #475569;
        }
      `}</style>
    </section>
  );
};

export default ServicePreview;
