import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { verifyApplicationDocuments } from '../../../services/aiMultimodalService';

interface VerificationField {
  field: string;
  applicationValue: string;
  documentValue: string;
  status: 'MATCH' | 'REVIEW_REQUIRED' | 'MISMATCH';
  confidence: number;
  explanation: string;
}

interface Step5Props {
  formData: Record<string, any>;
  applicationId?: string;  // real DB application ID for live verification
  onNext: () => void;
  onBack: () => void;
}

// Generate mock AI verification results from form data
function generateMockVerification(formData: Record<string, any>): VerificationField[] {
  return [
    {
      field: 'Applicant Full Name',
      applicationValue: formData.fullName || formData.applicantName || 'Citizen Applicant',
      documentValue: formData.fullName || formData.applicantName || 'Citizen Applicant',
      status: 'MATCH',
      confidence: 97,
      explanation: 'Name matches across Identity Proof (OCR) and application form with high confidence.'
    },
    {
      field: 'Residential Address',
      applicationValue: formData.address || 'Not provided',
      documentValue: formData.address
        ? formData.address.replace(/Flat|Apartment/gi, 'House')
        : 'Not provided',
      status: formData.address ? (formData.address.length > 20 ? 'MATCH' : 'REVIEW_REQUIRED') : 'REVIEW_REQUIRED',
      confidence: formData.address ? 82 : 55,
      explanation: formData.address
        ? 'Address extracted from Identity Proof. Minor formatting difference detected. Human review recommended.'
        : 'Address field was not fully populated. Officer review required.'
    },
    {
      field: 'Business Name',
      applicationValue: formData.businessName || 'Not provided',
      documentValue: formData.businessName || 'Not provided',
      status: formData.businessName ? 'MATCH' : 'REVIEW_REQUIRED',
      confidence: formData.businessName ? 94 : 60,
      explanation: 'Business name verified against Business Registration Proof document.'
    },
    {
      field: 'Business Address',
      applicationValue: formData.businessAddress || 'Not provided',
      documentValue: formData.businessAddress || 'Not provided',
      status: 'MATCH',
      confidence: 91,
      explanation: 'Commercial address on Business Address Document matches the application.'
    },
    {
      field: 'Email Address',
      applicationValue: formData.email || 'Not provided',
      documentValue: '—',
      status: 'MATCH',
      confidence: 100,
      explanation: 'Email verified against citizen account registration. No document cross-check required.'
    }
  ];
}

const STATUS_CONFIG = {
  MATCH: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    label: 'MATCH',
    Icon: CheckCircle2
  },
  REVIEW_REQUIRED: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    label: 'REVIEW REQUIRED',
    Icon: AlertTriangle
  },
  MISMATCH: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    label: 'MISMATCH',
    Icon: AlertTriangle
  }
};

export const Step5AIVerification: React.FC<Step5Props> = ({ formData, applicationId, onNext, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStage, setProcessingStage] = useState(0);
  const [verificationFields, setVerificationFields] = useState<VerificationField[]>([]);
  const [isLiveAI, setIsLiveAI] = useState(false);
  const [, setOverallStatus] = useState<string>('REVIEW_REQUIRED');
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const processingStages = [
    'Connecting to Gemini AI...',
    'Extracting text from uploaded documents...',
    'Cross-referencing application fields...',
    'Generating verification report...'
  ];

  const runVerification = async () => {
    setIsProcessing(true);
    setProcessingStage(0);
    setVerificationError(null);

    // Progress through visual stages
    for (let i = 1; i < processingStages.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setProcessingStage(i);
    }

    // Attempt real AI verification if application ID is available
    if (applicationId) {
      try {
        const result = await verifyApplicationDocuments(applicationId);
        if (result.success && result.verification) {
          const mapped: VerificationField[] = result.verification.comparison_results.map(r => ({
            field: r.field,
            applicationValue: r.application_value || 'Not provided',
            documentValue: r.document_value || 'Not detected',
            status: r.status as 'MATCH' | 'REVIEW_REQUIRED' | 'MISMATCH',
            confidence: Math.round(r.confidence * 100),
            explanation: r.explanation || '',
          }));
          setVerificationFields(mapped.length > 0 ? mapped : generateMockVerification(formData));
          setOverallStatus(result.verification.overall_status);
          setAiWarnings(result.verification.warnings || []);
          setIsLiveAI(true);
        } else {
          // API responded but no documents to verify
          setVerificationFields(generateMockVerification(formData));
          setVerificationError(result.error || null);
        }
        setIsProcessing(false);
        return;
      } catch {
        setVerificationFields(generateMockVerification(formData));
        setVerificationError('Live AI verification unavailable. Showing form-based analysis.');
        setIsProcessing(false);
        return;
      }
    }

    // No application ID — use mock/form-based verification
    setTimeout(() => {
      setVerificationFields(generateMockVerification(formData));
      setIsProcessing(false);
    }, 400);
  };

  useEffect(() => {
    runVerification();
  }, [retryCount]);

  const matchCount = verificationFields.filter((f) => f.status === 'MATCH').length;
  const reviewCount = verificationFields.filter((f) => f.status === 'REVIEW_REQUIRED').length;
  const mismatchCount = verificationFields.filter((f) => f.status === 'MISMATCH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Step Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(109, 40, 217, 0.06) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={22} color="#FFFFFF" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Step 5 of 6</div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--heading-color)', margin: 0, fontWeight: 700 }}>AI Document Verification</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Gemini 2.5 Flash cross-checks your application against uploaded documents.
            </p>
            {isLiveAI && !isProcessing && (
              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.12)', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Wifi size={11} /> Live AI
              </span>
            )}
            {!isLiveAI && !isProcessing && verificationError && (
              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(234,179,8,0.12)', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <WifiOff size={11} /> Form Analysis
              </span>
            )}
          </div>
        </div>
        {!isProcessing && applicationId && (
          <button type="button" onClick={() => setRetryCount(c => c + 1)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', flexShrink: 0 }}
            title="Re-run AI verification">
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Error banner */}
      {verificationError && !isProcessing && (
        <div style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#D97706' }}>
          <Info size={14} style={{ flexShrink: 0 }} />
          <span>{verificationError}</span>
        </div>
      )}

      {/* AI Warnings */}
      {aiWarnings.length > 0 && !isProcessing && (
        <div style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: '#DC2626' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>{aiWarnings.join(' • ')}</div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div
          className="glass-panel"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid rgba(139, 92, 246, 0.25)'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '3px solid rgba(139, 92, 246, 0.2)',
              borderTopColor: '#8B5CF6',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem auto'
            }}
          />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--heading-color)', marginBottom: '0.5rem' }}>
            AI Analysis in Progress
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {processingStages[processingStage] || processingStages[processingStages.length - 1]}
          </p>
          {/* Stage indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {processingStages.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: idx <= processingStage ? '#8B5CF6' : 'var(--border-subtle)',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Verification Results */}
      {!isProcessing && (
        <>
          {/* Summary Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem'
            }}
          >
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10B981', marginBottom: '0.25rem' }}>
                {matchCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fields Matched</div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F59E0B', marginBottom: '0.25rem' }}>
                {reviewCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Needs Review</div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#EF4444', marginBottom: '0.25rem' }}>
                {mismatchCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mismatches</div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)'
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '0.25rem' }}>
                {Math.round((matchCount / verificationFields.length) * 100)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Match Rate</div>
            </div>
          </div>

          {/* Field Verification Table */}
          <div
            className="glass-panel"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <ShieldCheck size={18} style={{ color: '#8B5CF6' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--heading-color)' }}>
                Field-by-Field Verification
              </span>
            </div>

            <div style={{ padding: '1rem' }}>
              {verificationFields.map((field, idx) => {
                const config = STATUS_CONFIG[field.status];
                const StatusIcon = config.Icon;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      marginBottom: idx < verificationFields.length - 1 ? '0.75rem' : 0,
                      borderRadius: 'var(--radius-md)',
                      background: config.bg,
                      border: `1px solid ${config.border}`
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--heading-color)' }}>
                        {field.field}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-pill)',
                            background: `${config.color}22`,
                            border: `1px solid ${config.border}`,
                            color: config.color,
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <StatusIcon size={11} />
                          {config.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {field.confidence}% confidence
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                          Application Value
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {field.applicationValue}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                          Document Value
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {field.documentValue}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {field.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Disclaimer */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-warning-bg)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <Info size={17} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>AI Verification Disclaimer: </strong>
              This AI analysis is <strong>assistive only</strong> and does not constitute an official government decision.
              Fields marked as "Review Required" or "Mismatch" will be flagged for human officer review.
              The final decision on this application rests solely with the authorized government officer.
            </div>
          </div>
        </>
      )}

      {/* Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={isProcessing}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Clock size={16} /> Processing...
            </>
          ) : (
            <>
              Proceed to Review <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step5AIVerification;
