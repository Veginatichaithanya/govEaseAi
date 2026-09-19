import React, { useState } from 'react';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  ClipboardCheck,
  User,
  Building,
  FileText,
  Files,
  AlertCircle,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import type { ApplicationRecord, DocumentUpload } from '../../../mock/applicationService';

interface Step6Props {
  application: ApplicationRecord;
  formData: Record<string, any>;
  uploadedDocs: DocumentUpload[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

interface ReviewRowProps {
  label: string;
  value?: string;
}
const ReviewRow: React.FC<ReviewRowProps> = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '1rem',
      padding: '0.7rem 0',
      borderBottom: '1px solid var(--border-subtle)'
    }}
  >
    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 }}>
      {label}
    </span>
    <span
      style={{
        fontSize: '0.88rem',
        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        fontWeight: value ? 500 : 400,
        textAlign: 'right',
        fontStyle: value ? 'normal' : 'italic'
      }}
    >
      {value || 'Not provided'}
    </span>
  </div>
);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Step6Review: React.FC<Step6Props> = ({
  application,
  formData,
  uploadedDocs,
  onBack,
  onSubmit,
  isSubmitting
}) => {
  const [declared, setDeclared] = useState(false);
  const [declarationError, setDeclarationError] = useState(false);

  const handleSubmit = () => {
    if (!declared) {
      setDeclarationError(true);
      return;
    }
    setDeclarationError(false);
    onSubmit();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Step Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <ClipboardCheck size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Step 6 of 6
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--heading-color)', margin: 0, fontWeight: 700 }}>
            Review & Submit
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Carefully review all information before final submission. You can go back to correct any details.
          </p>
        </div>
      </div>

      {/* Application ID Banner */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Application ID
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: '#38BDF8' }}>
            {application.id}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Service
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {application.serviceName}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#FBBF24'
            }}
          >
            {application.status}
          </span>
        </div>
      </div>

      {/* Section 1: Applicant Information */}
      <div
        className="glass-panel"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={17} style={{ color: '#60A5FA' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--heading-color)' }}>
              Applicant Information
            </span>
          </div>
          <button
            type="button"
            onClick={() => onBack()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: 'var(--accent-blue-light)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.2s'
            }}
            title="Go back to edit"
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
        <div style={{ padding: '0.5rem 1.5rem 1rem 1.5rem' }}>
          <ReviewRow label="Full Name" value={formData.fullName} />
          <ReviewRow label="Email" value={formData.email} />
          <ReviewRow label="Mobile" value={formData.mobileNumber} />
          <ReviewRow label="Date of Birth" value={formData.dateOfBirth} />
          <ReviewRow label="Address" value={formData.address} />
          <ReviewRow label="City" value={formData.city} />
          <ReviewRow label="State" value={formData.state} />
          <ReviewRow label="Postal Code" value={formData.postalCode} />
        </div>
      </div>

      {/* Section 2: Business Information */}
      <div
        className="glass-panel"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building size={17} style={{ color: '#22D3EE' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--heading-color)' }}>
              Business Information
            </span>
          </div>
          <button
            type="button"
            onClick={() => onBack()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: 'var(--accent-blue-light)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
        <div style={{ padding: '0.5rem 1.5rem 1rem 1.5rem' }}>
          <ReviewRow label="Business Name" value={formData.businessName} />
          <ReviewRow label="Business Type" value={formData.businessType} />
          <ReviewRow label="Business Category" value={formData.businessCategory} />
          <ReviewRow label="Business Address" value={formData.businessAddress} />
          <ReviewRow label="City" value={formData.businessCity} />
          <ReviewRow label="State" value={formData.businessState} />
          <ReviewRow label="Postal Code" value={formData.businessPostalCode} />
          <ReviewRow label="Start Date" value={formData.businessStartDate} />
          <ReviewRow label="No. of Employees" value={formData.numberOfEmployees?.toString()} />
        </div>
      </div>

      {/* Section 3: Application Details */}
      <div
        className="glass-panel"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={17} style={{ color: '#C084FC' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--heading-color)' }}>
              Application Details
            </span>
          </div>
          <button
            type="button"
            onClick={() => onBack()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: 'var(--accent-blue-light)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
        <div style={{ padding: '0.5rem 1.5rem 1rem 1.5rem' }}>
          <ReviewRow label="Application Purpose" value={formData.applicationPurpose} />
          <ReviewRow label="Business Description" value={formData.businessDescription} />
          <ReviewRow label="Additional Information" value={formData.additionalInformation} />
        </div>
      </div>

      {/* Section 4: Documents */}
      <div
        className="glass-panel"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <Files size={17} style={{ color: '#FBBF24' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--heading-color)' }}>
            Uploaded Documents
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              padding: '0.1rem 0.45rem',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            {uploadedDocs.length} uploaded
          </span>
        </div>
        <div style={{ padding: '1rem 1.5rem' }}>
          {uploadedDocs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No documents uploaded.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.documentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {doc.documentName}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      {doc.fileName} · {formatFileSize(doc.fileSize)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Declaration */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          background: declarationError
            ? 'rgba(239, 68, 68, 0.08)'
            : 'var(--bg-card)',
          border: declarationError
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid var(--border-accent)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ position: 'relative', marginTop: '0.1rem', flexShrink: 0 }}>
            <input
              type="checkbox"
              id="declaration-checkbox"
              checked={declared}
              onChange={(e) => {
                setDeclared(e.target.checked);
                if (e.target.checked) setDeclarationError(false);
              }}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-blue)',
                cursor: 'pointer'
              }}
            />
          </div>
          <label
            htmlFor="declaration-checkbox"
            style={{
              cursor: 'pointer',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Declaration: </strong>
            I hereby declare that all information provided in this application is true, correct, and complete
            to the best of my knowledge. I understand that any false declaration may result in rejection of this
            application and legal consequences as per applicable law.
          </label>
        </div>

        {declarationError && (
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#F87171',
              fontSize: '0.82rem'
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>Please accept the declaration before submitting your application.</span>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <ShieldAlert size={17} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Human Authority Notice: </strong>
          This application will be reviewed by an authorized government officer. AI verification is assistive only
          and does not constitute an official government approval. All decisions are made by human officers in
          accordance with applicable government regulations.
        </div>
      </div>

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
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 2rem',
            borderRadius: 'var(--radius-sm)',
            background: isSubmitting
              ? 'rgba(16, 185, 129, 0.5)'
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.95rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isSubmitting ? 'none' : '0 4px 15px -3px rgba(16, 185, 129, 0.4)'
          }}
        >
          {isSubmitting ? (
            <>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              Submitting...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step6Review;
