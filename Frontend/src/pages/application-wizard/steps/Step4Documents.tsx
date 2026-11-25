import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Files,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Info,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { DocumentUpload } from '../../../mock/applicationService';
import { MOCK_SERVICES } from '../../../mock/services';
import { apiClient } from '../../../services/apiClient';
import { mapOcrToFormFields, mappedFieldsToExtractionResult, buildAutofillMapping, type MappedField } from '../../../services/documentFieldMapper';
import { AIAutofillPanel } from '../../../components/AIAutofillPanel';
import type { ExtractionResult } from '../../../services/aiMultimodalService';

interface Step4Props {
  serviceId: string;
  applicationId: string;
  uploadedDocs: DocumentUpload[];
  onDocsChange: (docs: DocumentUpload[]) => void;
  onFormAutoFill: (fields: Record<string, string>, metadata: Record<string, { source: 'AI_EXTRACTED'; confidence?: number }>) => void;
  currentFormData?: Record<string, any>;
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

interface AutofillState {
  extraction: ExtractionResult;
  fieldMapping: Record<string, { formKey: string; label: string }>;
  mappedFields: MappedField[];
  documentName: string;
}

export const Step4Documents: React.FC<Step4Props> = ({
  serviceId,
  applicationId,
  uploadedDocs,
  onDocsChange,
  onFormAutoFill,
  currentFormData = {},
  onNext,
  onBack
}) => {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autofillState, setAutofillState] = useState<AutofillState | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get required documents from service config
  const service = MOCK_SERVICES.find((s) => s.id === serviceId);
  const requiredDocuments = service?.requiredDocuments || [];

  const getUploadedDoc = (docId: string): DocumentUpload | undefined =>
    uploadedDocs.find((d) => d.documentId === docId);

  const handleFileSelect = useCallback(async (docId: string, docName: string, file: File) => {
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

    // Prevent duplicate upload while processing
    if (processingIds.has(docId)) return;

    // Set processing state
    setProcessingIds((prev) => new Set([...prev, docId]));

    // Add a PROCESSING-state placeholder immediately
    const processingDoc: DocumentUpload = {
      documentId: docId,
      documentName: docName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || `application/${extension.replace('.', '')}`,
      status: 'PROCESSING',
      uploadedAt: new Date().toISOString()
    };
    const docsWithProcessing = uploadedDocs.filter((d) => d.documentId !== docId);
    docsWithProcessing.push(processingDoc);
    onDocsChange(docsWithProcessing);

    try {
      // Build FormData for real backend upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', docId);
      formData.append('documentName', docName);

      // POST to backend document upload endpoint
      const response = await apiClient.post<any>(
        `/applications/${applicationId}/documents`,
        formData
      );

      if (!response.ok) {
        throw new Error(response.error || `Upload failed (HTTP ${response.status})`);
      }

      const data = response.data;

      // Build DocumentUpload from backend response
      const newDoc: DocumentUpload = {
        documentId: docId,
        documentName: data.documentName || docName,
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || file.size,
        fileType: data.fileType || file.type,
        status: data.status || 'VERIFIED',
        uploadedAt: data.uploadedAt || new Date().toISOString(),
        verificationResult: data.verificationResult || undefined,
      };

      // Replace placeholder with actual result
      const updatedDocs = uploadedDocs.filter((d) => d.documentId !== docId);
      updatedDocs.push(newDoc);
      onDocsChange(updatedDocs);

      // If OCR returned extracted data, trigger auto-fill panel
      if (data.verificationResult && !data.verificationResult.error) {
        const mappedFields = mapOcrToFormFields(data.verificationResult, docName);
        if (mappedFields.length > 0) {
          const extraction = mappedFieldsToExtractionResult(
            mappedFields,
            data.verificationResult?.document_type
          );
          const fieldMapping = buildAutofillMapping(mappedFields);
          setAutofillState({
            extraction,
            fieldMapping,
            mappedFields,
            documentName: docName,
          });
        }
      }
    } catch (err: any) {
      console.error('Document upload failed:', err);

      // Set error state on the document
      const errorDoc: DocumentUpload = {
        documentId: docId,
        documentName: docName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || `application/${extension.replace('.', '')}`,
        status: 'ERROR',
        uploadedAt: new Date().toISOString()
      };
      const errorDocs = uploadedDocs.filter((d) => d.documentId !== docId);
      errorDocs.push(errorDoc);
      onDocsChange(errorDocs);

      setFileErrors((prev) => ({
        ...prev,
        [docId]: err.message || 'Upload failed. Please try again.'
      }));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, [applicationId, uploadedDocs, onDocsChange, processingIds]);

  const handleRemoveDoc = (docId: string) => {
    onDocsChange(uploadedDocs.filter((d) => d.documentId !== docId));
    // Reset file input
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId]!.value = '';
    }
    // Clear any error
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const handleAutoFillApply = (fields: Record<string, string>) => {
    // Build metadata for each AI-filled field
    const metadata: Record<string, { source: 'AI_EXTRACTED'; confidence?: number }> = {};
    if (autofillState) {
      for (const field of autofillState.mappedFields) {
        if (fields[field.formKey]) {
          metadata[field.formKey] = {
            source: 'AI_EXTRACTED',
            confidence: field.confidence,
          };
        }
      }
    }
    onFormAutoFill(fields, metadata);
    setAutofillState(null);
  };

  const handleAutoFillDismiss = () => {
    setAutofillState(null);
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
    // Check none are still in ERROR state
    const errorDocs = uploadedDocs.filter(d => d.status === 'ERROR');
    if (errorDocs.length > 0) {
      setSubmitError(
        `Some documents failed processing. Please re-upload: ${errorDocs.map(d => d.documentName).join(', ')}`
      );
      return;
    }
    onNext();
  };

  const getStatusDisplay = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'VERIFIED':
        return { label: 'Verified', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' };
      case 'PROCESSING':
        return { label: 'Processing...', color: '#60A5FA', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
      case 'ERROR':
        return { label: 'Processing Failed', color: '#F87171', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
      case 'PENDING':
        return { label: 'Pending', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
      default:
        return { label: status, color: '#94A3B8', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.2)' };
    }
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
          <br />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
            <Sparkles size={13} color="#6366F1" />
            <strong style={{ color: '#6366F1' }}>AI Auto-Fill:</strong> Uploaded documents are processed by AI to automatically extract and suggest form field values.
          </span>
        </div>
      </div>

      {/* AI Auto-Fill Panel (shown after OCR extraction) */}
      {autofillState && (
        <AIAutofillPanel
          key={`${autofillState.documentName}-${Date.now()}`}
          extraction={autofillState.extraction}
          fieldMapping={autofillState.fieldMapping}
          onApply={handleAutoFillApply}
          onDismiss={handleAutoFillDismiss}
          currentFormValues={currentFormData as Record<string, string>}
        />
      )}

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
          const statusDisplay = uploadedDoc ? getStatusDisplay(uploadedDoc.status) : null;

          return (
            <div
              key={doc.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: isUploaded && uploadedDoc?.status === 'VERIFIED'
                  ? '1px solid rgba(16, 185, 129, 0.35)'
                  : isUploaded && uploadedDoc?.status === 'ERROR'
                  ? '1px solid rgba(239, 68, 68, 0.35)'
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
                  {isUploaded && uploadedDoc && statusDisplay && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: statusDisplay.bg,
                        border: `1px solid ${statusDisplay.border}`
                      }}
                    >
                      {uploadedDoc.status === 'VERIFIED' ? (
                        <CheckCircle2 size={16} style={{ color: statusDisplay.color, flexShrink: 0 }} />
                      ) : uploadedDoc.status === 'ERROR' ? (
                        <AlertCircle size={16} style={{ color: statusDisplay.color, flexShrink: 0 }} />
                      ) : (
                        <FileText size={16} style={{ color: statusDisplay.color, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: statusDisplay.color,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {uploadedDoc.fileName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {formatFileSize(uploadedDoc.fileSize)} · {statusDisplay.label}
                          {uploadedDoc.verificationResult?.document_type && (
                            <span style={{ color: '#6366F1' }}>
                              · {uploadedDoc.verificationResult.document_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {uploadedDoc.status === 'ERROR' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (fileInputRefs.current[doc.id]) {
                                fileInputRefs.current[doc.id]!.click();
                              }
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              cursor: 'pointer',
                              color: '#FBBF24',
                              padding: '0.3rem',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                            }}
                            title="Retry upload"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
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
                      <Loader2
                        size={14}
                        style={{
                          flexShrink: 0,
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      Uploading & processing with AI...
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
                      // Reset input so the same file can be re-selected
                      e.target.value = '';
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
                      background: isUploaded && uploadedDoc?.status === 'VERIFIED'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'var(--accent-blue)',
                      border: isUploaded && uploadedDoc?.status === 'VERIFIED'
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : 'none',
                      color: isUploaded && uploadedDoc?.status === 'VERIFIED' ? '#34D399' : '#FFFFFF',
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
        <span>·</span>
        <span>
          <strong style={{ color: '#10B981' }}>
            {uploadedDocs.filter(d => d.status === 'VERIFIED').length}
          </strong>{' '}
          verified
          {uploadedDocs.filter(d => d.status === 'ERROR').length > 0 && (
            <span style={{ color: '#F87171', marginLeft: '0.5rem' }}>
              · <strong>{uploadedDocs.filter(d => d.status === 'ERROR').length}</strong> failed
            </span>
          )}
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
          disabled={processingIds.size > 0}
        >
          {processingIds.size > 0 ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </>
          ) : (
            <>
              Continue to AI Verification <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step4Documents;
