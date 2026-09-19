import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_SERVICES } from '../mock/services';
import { mockAIService, type ChatMessage, SUGGESTED_QUESTIONS } from '../mock/aiService';
import {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Clock,
  Coins,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  Bot,
  User,
  AlertTriangle,
  Info
} from 'lucide-react';

const iconMap = {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck
};

export const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'process'>('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);



  // Lookup service from centralized data
  const service = MOCK_SERVICES.find((s) => s.id === serviceId);

  // Reset or initialize default greeting in chat when service changes
  useEffect(() => {
    if (service) {
      setChatMessages([
        {
          id: 'initial-ai-greeting',
          sender: 'ai',
          text: `Hello! I'm your GovEaseAI assistant for the ${service.name} application. Ask me about required documents, eligibility rules, processing times, or application steps.`,
          timestamp: 'Just now'
        }
      ]);
    }
  }, [service]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // Handle Invalid Service URL (e.g. /services/invalid-service)
  if (!service) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '640px', textAlign: 'center', margin: '4rem auto' }}>
          <div
            className="glass-panel"
            style={{
              padding: '4rem 2.5rem',
              background: 'var(--bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171',
                marginBottom: '1.25rem'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h1 style={{ fontSize: '1.75rem', color: 'var(--heading-color)', marginBottom: '0.75rem' }}>
              Service not found
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The government service identifier <code style={{ color: '#F87171' }}>"{serviceId}"</code> does not exist in the GovEaseAI catalog.
            </p>

            <Link
              to="/services"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.75rem' }}
            >
              <ArrowLeft size={16} /> Back to Services
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const IconComponent = iconMap[service.iconName] || Building;

  const handleSendMessage = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isAiLoading) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      // 2. Fetch AI response via backend proxy with history
      const aiReply = await mockAIService.ask(service, textToSend, chatMessages);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'AI guidance is temporarily unavailable. Please try again.',
        timestamp: 'Just now'
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(chatInput);
  };

  return (
    <DashboardLayout>
      <div>
          {/* Back Navigation */}
          <div style={{ marginBottom: '1.75rem' }}>
            <Link
              to="/services"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                textDecoration: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid transparent',
                transition: 'all 0.18s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              }}
            >
              <ArrowLeft size={16} /> Back to Services
            </Link>
          </div>

          {/* Service Master Header */}
          <div
            className="glass-panel"
            style={{
              padding: '2.5rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              marginBottom: '2.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ maxWidth: '760px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(37, 99, 235, 0.12)',
                      border: '1px solid rgba(37, 99, 235, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-blue)'
                    }}
                  >
                    <IconComponent size={26} />
                  </div>
                  <div>
                    <span
                      className="badge badge-info"
                      style={{
                        fontSize: '0.72rem',
                        marginRight: '0.6rem'
                      }}
                    >
                      {service.category}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {service.department}
                    </span>
                  </div>
                </div>

                <h1 style={{ fontSize: 'clamp(1.95rem, 3.8vw, 2.65rem)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  {service.name}
                </h1>

                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {service.description}
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <ShieldAlert size={12} color="var(--text-muted)" />
                  Prototype specification. Final statutory sanction issued exclusively by authorized municipal officer.
                </div>
              </div>

              {/* Action Box */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  minWidth: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem'
                }}
              >
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                    PROCESSING TIMELINE
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={15} color="var(--accent-blue)" /> {service.processingTime}
                  </span>
                </div>

                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                    STATUTORY APPLICATION FEE
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Coins size={15} color="#F59E0B" /> {service.fee}
                  </span>
                </div>

                <Link
                  to={`/applications/new/${service.id}`}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  Start Application <ArrowRight size={16} />
                </Link>

                <Link
                  to={`/services/${service.id}/assistant`}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderColor: 'rgba(6, 182, 212, 0.4)',
                    color: 'var(--accent-cyan)'
                  }}
                >
                  <Sparkles size={16} /> Ask About This Service
                </Link>
              </div>
            </div>
          </div>


          {/* Service Details & AI Guidance Two-Column Layout */}
          <div className="service-details-grid">
            {/* Left Column: Eligibility, Documents & 9-Step Process */}
            <div className="service-info-column">
              {/* Tab Selector */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                  marginBottom: '1.75rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem'
                }}
              >
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`detail-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                >
                  Eligibility Guidelines
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`detail-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                >
                  Required Documents ({service.requiredDocuments.length})
                </button>
                <button
                  onClick={() => setActiveTab('process')}
                  className={`detail-tab-btn ${activeTab === 'process' ? 'active' : ''}`}
                >
                  Application Workflow (9 Steps)
                </button>
              </div>

              {/* Tab 1: Eligibility */}
              {activeTab === 'overview' && (
                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(11, 25, 45, 0.75)' }}>
                  <h3 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.25rem' }}>
                    Who Can Apply?
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
                    (Prototype demonstration criteria — actual legal eligibility is validated during officer desk review)
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
                    {service.eligibility.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem',
                          padding: '0.9rem 1.15rem',
                          background: 'rgba(15, 31, 53, 0.55)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(148, 163, 184, 0.1)'
                        }}
                      >
                        <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.95rem', color: '#E2E8F0', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: '1.15rem 1.35rem',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.22)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem'
                    }}
                  >
                    <Info size={18} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                      <strong>Need guidance on your specific case?</strong> Use the AI Guidance assistant
                      on the right to verify requirements or clarify prerequisite documentation.
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Required Documents */}
              {activeTab === 'documents' && (
                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(11, 25, 45, 0.75)' }}>
                  <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                    Required Supporting Documents
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
                    Prepare these documents before beginning your application. GovEaseAI's multimodal OCR will
                    extract and verify these records. (No actual upload is performed on this page).
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {service.requiredDocuments.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '1.15rem 1.35rem',
                          background: 'rgba(15, 31, 53, 0.6)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          flexWrap: 'wrap',
                          gap: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '240px' }}>
                          <FileText size={20} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: '#94A3B8', lineHeight: 1.45 }}>
                              {doc.description}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.7rem',
                              background: doc.required ? 'rgba(239, 68, 68, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                              color: doc.required ? '#F87171' : '#94A3B8',
                              border: doc.required ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)'
                            }}
                          >
                            {doc.required ? 'Required' : 'Optional'}
                          </span>
                          {doc.type && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                              {doc.type}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Application Process (9 Steps) */}
              {activeTab === 'process' && (
                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(11, 25, 45, 0.75)' }}>
                  <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                    Complete GovEaseAI Application Lifecycle
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.75rem' }}>
                    From online intake to digital sanction, GovEaseAI ensures full transparency at each milestone:
                  </p>

                  <div className="step-workflow-list">
                    {service.applicationSteps.map((stepStr, idx) => {
                      const isAiStep = stepStr.includes('AI');
                      const isOfficerStep = stepStr.includes('Officer');
                      const isApproval = stepStr.includes('Approval');

                      return (
                        <div
                          key={idx}
                          className={`process-node-card ${isAiStep ? 'node-ai' : ''} ${isOfficerStep ? 'node-officer' : ''}`}
                        >
                          <div className="node-num-circle">{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF' }}>
                                {stepStr.replace(/^\d+\.\s*/, '')}
                              </span>
                              {isAiStep && (
                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                  AI-assisted
                                </span>
                              )}
                              {isOfficerStep && (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                  Human Authority
                                </span>
                              )}
                              {isApproval && (
                                <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' }}>
                                  Digital Certificate
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Guidance & Interactive Chat UI */}
            <div className="ai-guidance-column">
              <div
                className="glass-panel ai-guidance-card"
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* AI Guidance Header */}
                <div className="ai-header-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="ai-avatar-box">
                      <Bot size={20} color="var(--accent-blue)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        AI Guidance <Sparkles size={14} color="var(--accent-blue)" />
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Ask anything about this service.
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                    OpenRouter AI
                  </span>
                </div>

                {/* Suggested Questions Grid */}
                <div className="suggested-questions-tray">
                  <span className="tray-label">SUGGESTED QUESTIONS:</span>
                  <div className="suggested-chips">
                    {SUGGESTED_QUESTIONS.map((question: string, qIdx: number) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSendMessage(question)}
                        disabled={isAiLoading}
                        className="suggested-chip-btn"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Log Window */}
                <div className="chat-log-window">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
                    >
                      <div className="bubble-sender-icon">
                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className="chat-bubble-body">
                        <div className="bubble-text">{msg.text}</div>
                        <div className="bubble-time">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))}

                  {/* Typing / Loading Indicator */}
                  {isAiLoading && (
                    <div className="chat-bubble-row ai-row">
                      <div className="bubble-sender-icon">
                        <Bot size={14} />
                      </div>
                      <div className="chat-bubble-body loading-bubble">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Box */}
                <form onSubmit={handleFormSubmit} className="chat-input-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a question (e.g., 'What documents are required?')..."
                    disabled={isAiLoading}
                    className="chat-input-field"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isAiLoading}
                    className="chat-send-btn"
                    title="Send message"
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Mandatory Disclaimer Footer */}
                <div className="ai-disclaimer-strip">
                  <HelpCircle size={13} color="#94A3B8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>AI-generated guidance — verify final requirements with the authorized department.</span>
                </div>
              </div>
            </div>
          </div>

        <style>{`
          .service-details-grid {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 2rem;
          }

          .detail-tab-btn {
            font-family: var(--font-display);
            font-size: 0.925rem;
            font-weight: 600;
            padding: 0.6rem 1.15rem;
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
          }

          .detail-tab-btn.active {
            color: #FFFFFF;
            background: var(--accent-blue);
            border: 1px solid var(--accent-blue);
          }

          .step-workflow-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .process-node-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.85rem 1.15rem;
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-sm);
          }

          .process-node-card.node-ai {
            background: rgba(6, 182, 212, 0.08);
            border-color: rgba(6, 182, 212, 0.3);
          }

          .process-node-card.node-officer {
            background: rgba(16, 185, 129, 0.08);
            border-color: rgba(16, 185, 129, 0.3);
          }

          .node-num-circle {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.15);
            color: var(--accent-blue);
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .ai-guidance-card {
            display: flex;
            flex-direction: column;
            height: 640px;
            border-radius: var(--radius-lg);
            overflow: hidden;
          }

          .ai-header-strip {
            padding: 1.15rem 1.5rem;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .ai-avatar-box {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: rgba(37, 99, 235, 0.12);
            border: 1px solid rgba(37, 99, 235, 0.28);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .suggested-questions-tray {
            padding: 0.85rem 1.25rem;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-subtle);
          }

          .tray-label {
            font-family: var(--font-mono);
            font-size: 0.65rem;
            color: var(--text-muted);
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 0.45rem;
          }

          .suggested-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }

          .suggested-chip-btn {
            font-family: var(--font-display);
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary);
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            padding: 0.35rem 0.65rem;
            border-radius: var(--radius-pill);
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: left;
          }

          .suggested-chip-btn:hover:not(:disabled) {
            color: #FFFFFF;
            background: var(--accent-blue);
            border-color: var(--accent-blue);
          }

          .chat-log-window {
            flex: 1;
            overflow-y: auto;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            background: var(--bg-card);
          }

          .chat-bubble-row {
            display: flex;
            gap: 0.65rem;
            align-items: flex-start;
            max-width: 90%;
          }

          .chat-bubble-row.user-row {
            align-self: flex-end;
            flex-direction: row-reverse;
          }

          .chat-bubble-row.ai-row {
            align-self: flex-start;
          }

          .bubble-sender-icon {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .user-row .bubble-sender-icon {
            background: #2563EB;
            color: #FFFFFF;
          }

          .ai-row .bubble-sender-icon {
            background: rgba(37, 99, 235, 0.15);
            color: var(--accent-blue);
            border: 1px solid rgba(37, 99, 235, 0.3);
          }

          .chat-bubble-body {
            padding: 0.75rem 0.95rem;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            line-height: 1.5;
          }

          .user-row .chat-bubble-body {
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
            color: #FFFFFF;
            border-bottom-right-radius: 2px;
          }

          .ai-row .chat-bubble-body {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-subtle);
            border-bottom-left-radius: 2px;
          }

          .bubble-time {
            font-family: var(--font-mono);
            font-size: 0.65rem;
            color: var(--text-muted);
            margin-top: 0.3rem;
            text-align: right;
          }

          .loading-bubble {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 0.85rem 1.15rem;
          }

          .loading-bubble .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent-blue);
            animation: dotBounce 1.2s infinite ease-in-out;
          }
          .loading-bubble .dot:nth-child(2) { animation-delay: 0.2s; }
          .loading-bubble .dot:nth-child(3) { animation-delay: 0.4s; }

          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }

          .chat-input-form {
            padding: 0.85rem 1.15rem;
            background: var(--bg-card);
            border-top: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            gap: 0.65rem;
          }

          .chat-input-field {
            flex: 1;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: var(--radius-sm);
            padding: 0.65rem 0.95rem;
            color: var(--input-text);
            font-family: inherit;
            font-size: 0.88rem;
            outline: none;
          }

          .chat-input-field:focus {
            border-color: var(--accent-blue);
          }

          .chat-send-btn {
            width: 38px;
            height: 38px;
            border-radius: var(--radius-sm);
            background: #2563EB;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.15s ease;
            border: none;
          }

          .chat-send-btn:hover:not(:disabled) {
            background: #3B82F6;
          }

          .chat-send-btn:disabled {
            background: var(--border-subtle);
            color: var(--text-muted);
            cursor: not-allowed;
          }

          .ai-disclaimer-strip {
            padding: 0.65rem 1.15rem;
            background: var(--bg-card);
            border-top: 1px solid var(--border-subtle);
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            font-family: var(--font-mono);
            font-size: 0.7rem;
            color: var(--text-muted);
            line-height: 1.4;
          }

          @media (max-width: 960px) {
            .service-details-grid {
              grid-template-columns: 1fr;
            }
            .ai-guidance-card {
              height: 540px;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default ServiceDetailPage;
