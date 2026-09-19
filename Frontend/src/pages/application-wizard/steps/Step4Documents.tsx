import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Files,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Info
} from 'lucide-react';
import type { DocumentUpload } from '../../../mock/applicationService';
import { MOCK_SERVICES } from '../../../mock/services';

interface Step4Props {
  serviceId: string;
  uploadedDocs: DocumentUpload[];
  onDocsChange: (docs: DocumentUpload[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Step4Documents: React.FC<Step4Props> = ({
  serviceId,
  uploadedDocs,
  onDocsChange,
  onNext,
  onBack
}) => {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get required documents from service config
  const service = MOCK_SERVICES.find((s) => s.id === serviceId);
  const requiredDocuments = service?.requiredDocuments || [];

  const getUploadedDoc = (docId: string): DocumentUpload | undefined =>
    uploadedDocs.find((d) => d.documentId === docId);

  const handleFileSelect = async (docId: string, docName: string, file: File) => {
    // Clear previous error for this doc
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });

    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      setFileErrors((prev) => ({
        ...prev,
        [docId]: `Invalid file type. Allowed: PDF, JPG, PNG`
      }));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileErrors((prev) => ({
        ...prev,
        [docId]: `File exceeds maximum size of ${MAX_FILE_SIZE_MB} MB`
      }));
      return;
    }

    // Add to processing state
    setProcessingIds((prev) => new Set([...prev, docId]));

    // Simulate upload + processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newDoc: DocumentUpload = {
      documentId: docId,
      documentName: docName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || `application/${extension.replace('.', '')}`,
      status: 'VERIFIED',
      uploadedAt: new Date().toISOString()
    };

    // Replace or add document
    const updatedDocs = uploadedDocs.filter((d) => d.documentId !== docId);
    updatedDocs.push(newDoc);
    onDocsChange(updatedDocs);

    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
  };

  const handleRemoveDoc = (docId: string) => {
    onDocsChange(uploadedDocs.filter((d) => d.documentId !== docId));
    // Reset file input
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId]!.value = '';
    }
  };

  const handleContinue = () => {
    setSubmitError(null);
    // Check all required documents are uploaded
    const missingRequired = requiredDocuments.filter(
      (doc) => doc.required && !getUploadedDoc(doc.id)
    );
    if (missingRequired.length > 0) {
      setSubmitError(
        `Please upload all required documents: ${missingRequired.map((d) => d.name).join(', ')}`
      );
      return;
    }
    onNext();
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
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Files size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Step 4 of 6
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--heading-color)', margin: 0, fontWeight: 700 }}>
            Document Upload
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Upload all required supporting documents for your {service?.name} application.
          </p>
        </div>
      </div>

      {/* Upload guidelines */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--status-info-bg)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <Info size={17} style={{ color: 'var(--accent-blue-light)', flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Upload Guidelines:</strong> Accepted formats: PDF, JPG, PNG.
          Maximum file size: {MAX_FILE_SIZE_MB} MB per document. Ensure all documents are clear and legible.
          Documents marked <span style={{ color: '#EF4444', fontWeight: 700 }}>Required</span> must be uploaded before proceeding.
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Document Upload Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requiredDocuments.map((doc) => {
          const uploadedDoc = getUploadedDoc(doc.id);
          const isProcessing = processingIds.has(doc.id);
          const fileError = fileErrors[doc.id];
          const isUploaded = !!uploadedDoc && !isProcessing;

          return (
            <div
              key={doc.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: isUploaded
                  ? '1px solid rgba(16, 185, 129, 0.35)'
                  : fileError
                  ? '1px solid rgba(239, 68, 68, 0.35)'
                  : '1px solid var(--border-subtle)',
                transition: 'border-color 0.2s'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Document Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--heading-color)'
                      }}
                    >
                      {doc.name}
                    </span>
                    {doc.required ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          textTransform: 'uppercase'
                        }}
                      >
                        Required
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(100, 116, 139, 0.15)',
                          border: '1px solid rgba(100, 116, 139, 0.2)',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}
                      >
                        Optional
                      </span>
                    )}
                    {doc.type && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.type}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {doc.description}
                  </p>

                  {/* Uploaded File Info */}
                  {isUploaded && uploadedDoc && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: '#34D399',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {uploadedDoc.fileName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {formatFileSize(uploadedDoc.fileSize)} · Verified
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94A3B8',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          transition: 'color 0.2s'
                        }}
                        title="Remove document"
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#F87171')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94A3B8')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Processing State */}
                  {isProcessing && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#60A5FA',
                        fontSize: '0.83rem'
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: '2px solid rgba(59, 130, 246, 0.3)',
                          borderTopColor: '#60A5FA',
                          animation: 'spin 0.8s linear infinite',
                          flexShrink: 0
                        }}
                      />
                      Processing document...
                    </div>
                  )}

                  {/* File Error */}
                  {fileError && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#F87171',
                        fontSize: '0.8rem'
                      }}
                    >
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div style={{ flexShrink: 0 }}>
                  <input
                    type="file"
                    id={`file-input-${doc.id}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(doc.id, doc.name, file);
                    }}
                  />
                  <label
                    htmlFor={`file-input-${doc.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isUploaded ? 'rgba(16, 185, 129, 0.12)' : 'var(--accent-blue)',
                      border: isUploaded ? '1px solid rgba(16, 185, 129, 0.35)' : 'none',
                      color: isUploaded ? '#34D399' : '#FFFFFF',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.6 : 1,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    {isUploaded ? (
                      <><FileText size={15} /> Re-upload</>
                    ) : (
                      <><Upload size={15} /> Upload File</>
                    )}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>{uploadedDocs.length}</strong> of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{requiredDocuments.length}</strong> documents uploaded
        </span>
        <span>·</span>
        <span>
          <strong style={{ color: '#34D399' }}>
            {requiredDocuments.filter((d) => d.required && getUploadedDoc(d.id)).length}
          </strong>{' '}
          of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {requiredDocuments.filter((d) => d.required).length}
          </strong>{' '}
          required completed
        </span>
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
          border: '1px solid var(--border-accent)'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Continue to AI Verification <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Step4Documents;
