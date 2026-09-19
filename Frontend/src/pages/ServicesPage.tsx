import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_SERVICES, type ServiceCategory } from '../mock/services';
import {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  Clock,
  Coins,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';


const iconMap = {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck
};

export const ServicesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Sync with URL query parameter
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Categories: All, Business, Construction, Industry, Environment
  const categories: (ServiceCategory | 'All')[] = ['All', 'Business', 'Construction', 'Industry', 'Environment'];

  useEffect(() => {
    // Brief simulated loading state for realistic future API readiness
    const timer = setTimeout(() => {
      setLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Real client-side search and category filter combined
  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return MOCK_SERVICES.filter((service) => {
      const matchesSearch =
        q === '' ||
        service.name.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        service.shortDescription.toLowerCase().includes(q) ||
        service.department.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'All' || service.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Compact Page Header - Top spacing removed and aligned with Citizen Portal standard */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 2.5vw, 2.15rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 0.35rem 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            Government Services
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 0.35rem 0', lineHeight: 1.5 }}>
            Access government services online with AI-powered guidance and a simplified application process.
          </p>

          {/* Prototype Notice */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}
          >
            <ShieldAlert size={13} color="var(--text-muted)" />
            Prototype service descriptions. Final approval always rests with authorized municipal officers.
          </div>
        </div>

        {/* Search, Filter & Live Counter Bar */}
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              flex: '1 1 320px',
              maxWidth: '420px',
              minWidth: '240px',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.85rem'
            }}
          >
            <Search size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or keyword"
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--input-text)',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                width: '100%'
              }}
              aria-label="Search government services"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem', background: 'none', border: 'none' }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                marginRight: '0.2rem',
                fontWeight: 600
              }}
            >
              <Filter size={12} /> CATEGORY:
            </span>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius-pill)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    background: isSelected ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Live Count Indicator */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-blue)',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap'
            }}
          >
            {filteredServices.length} {filteredServices.length === 1 ? 'service available' : 'services available'}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(59, 130, 246, 0.2)',
                borderTopColor: 'var(--accent-blue)',
                borderRadius: '50%',
                margin: '0 auto 0.75rem auto',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>Loading services catalog...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredServices.length === 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              maxWidth: '600px',
              margin: '1.5rem auto'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FBBF24',
                marginBottom: '1rem'
              }}
            >
              <Search size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No services found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              We couldn't find any government services matching "{searchQuery}" in category "{selectedCategory}".
              Try clearing your search term or selecting a different category.
            </p>
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={15} /> Reset Filters
            </button>
          </div>
        )}

        {/* Services Cards Grid (3-Column Desktop Grid) */}
        {!loading && filteredServices.length > 0 && (
          <div className="grid-3" style={{ gap: '1.5rem', alignItems: 'stretch' }}>
            {filteredServices.map((service) => {
              const IconComponent = iconMap[service.iconName as keyof typeof iconMap] || Building;

              return (
                <div
                  key={service.id}
                  className="glass-panel service-item-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Top Color Accent */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background:
                        service.category === 'Business'
                          ? 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%)'
                          : service.category === 'Construction'
                          ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                          : service.category === 'Industry'
                          ? 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)'
                          : 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Header: Icon & Category Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.85rem'
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(37, 99, 235, 0.12)',
                          border: '1px solid rgba(37, 99, 235, 0.28)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-blue)'
                        }}
                      >
                        <IconComponent size={20} strokeWidth={2} />
                      </div>

                      <span
                        className="badge badge-info"
                        style={{
                          fontSize: '0.7rem'
                        }}
                      >
                        {service.category}
                      </span>
                    </div>

                    {/* Service Name */}
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: '0 0 0.35rem 0',
                        lineHeight: 1.3
                      }}
                    >
                      {service.name}
                    </h3>

                    {/* Short Description */}
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: '0 0 1rem 0',
                        flexGrow: 1,
                        minHeight: '44px'
                      }}
                    >
                      {service.shortDescription}
                    </p>

                    {/* Key Metadata Block */}
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.7rem 0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        marginBottom: '1rem',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} color="var(--accent-blue)" /> Processing:
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{service.processingTime}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Coins size={13} color="#F59E0B" /> Fee:
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{service.fee}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileText size={13} color="var(--status-success)" /> Documents:
                        </span>
                        <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                          {service.requiredDocuments.length} required
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <Link
                      to={`/services/${service.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.825rem', padding: '0.55rem 0.75rem', justifyContent: 'center' }}
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/applications/new/${service.id}`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.825rem', padding: '0.55rem 0.75rem', justifyContent: 'center' }}
                    >
                      Start Application <ArrowRight size={14} />
                    </Link>
                  </div>

                  <Link
                    to={`/services/${service.id}/assistant`}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      fontSize: '0.8rem',
                      padding: '0.45rem 0.65rem',
                      justifyContent: 'center',
                      borderColor: 'rgba(6, 182, 212, 0.4)',
                      color: 'var(--accent-cyan)'
                    }}
                    title={`Ask AI about ${service.name}`}
                  >
                    <Sparkles size={14} /> Ask AI Assistant
                  </Link>
                </div>
              );
            })}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServicesPage;
