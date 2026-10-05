import React, { useState, useRef } from 'react';
import { ArrowRight, Save, AlertCircle, User, Sparkles, Upload, Loader2, WifiOff } from 'lucide-react';
import {
  TRADE_LICENSE_FORM_CONFIG,
  validateFormSections,
  validateField,
  type FormFieldConfig
} from '../../../config/formConfig';
import { AIAutofillPanel } from '../../../components/AIAutofillPanel';
import { analyzeFile, type ExtractionResult } from '../../../services/aiMultimodalService';

interface Step1Props {
  formData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  isSaving: boolean;
}

const ID_FIELD_MAPPING: Record<string, { formKey: string; label: string }> = {
  // Name aliases
  name: { formKey: 'fullName', label: 'Applicant Full Name' },
  applicant_name: { formKey: 'fullName', label: 'Applicant Full Name' },
  full_name: { formKey: 'fullName', label: 'Applicant Full Name' },
  // Father / Spouse name aliases
  father_name: { formKey: 'fatherSpouseName', label: 'Father / Spouse Name' },
  father_spouse_name: { formKey: 'fatherSpouseName', label: 'Father / Spouse Name' },
  spouse_name: { formKey: 'fatherSpouseName', label: 'Father / Spouse Name' },
  // Gender
  gender: { formKey: 'gender', label: 'Gender' },
  // Mobile — form field is mobileNumber
  mobile: { formKey: 'mobileNumber', label: 'Mobile Number' },
  phone: { formKey: 'mobileNumber', label: 'Mobile Number' },
  mobile_number: { formKey: 'mobileNumber', label: 'Mobile Number' },
  // Email
  email: { formKey: 'email', label: 'Email Address' },
  // Address aliases
  address: { formKey: 'address', label: 'Residential Address' },
  residential_address: { formKey: 'address', label: 'Residential Address' },
  // City / District
  city: { formKey: 'city', label: 'City / District' },
  district: { formKey: 'city', label: 'City / District' },
  // Pincode — form field is postalCode
  pincode: { formKey: 'postalCode', label: 'Postal Pincode' },
  postal_code: { formKey: 'postalCode', label: 'Postal Pincode' },
  // State
  state: { formKey: 'state', label: 'State' },
  // Date of Birth (PAN card field)
  date_of_birth: { formKey: 'dateOfBirth', label: 'Date of Birth' },
  dob: { formKey: 'dateOfBirth', label: 'Date of Birth' },
};

const section = TRADE_LICENSE_FORM_CONFIG.sections[0]; // Applicant Info section

export const Step1ApplicantInfo: React.FC<Step1Props> = ({
  formData,
  onChange,
  onNext,
  onSaveDraft,
  isSaving
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (field: FormFieldConfig, value: any) => {
    onChange({ ...formData, [field.name]: value });
    // Clear error when field becomes valid
    if (errors[field.name]) {
      const error = validateField(field, value);
      if (!error) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field.name];
          return next;
        });
      }
    }
  };

  const handleBlur = (field: FormFieldConfig) => {
    const error = validateField(field, formData[field.name]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field.name]: error }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field.name];
        return next;
      });
    }
  };

  const handleNext = () => {
    const sectionErrors = validateFormSections([section], formData);
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors);
      const firstKey = Object.keys(sectionErrors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onNext();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtraction(null);
    setExtractionError(null);

    try {
      const res = await analyzeFile(
        file,
        'Extract all identity proof fields from this document: full name, father name or spouse name, date of birth, gender, PAN number, Aadhaar number, mobile number, email, residential address, city, pincode, state. Return only what is clearly visible in the document — do not invent or guess any values.'
      );
      if (res.success && res.extraction) {
        // Only keep fields that actually have non-null, non-empty values from the document
        const cleanedFields: Record<string, string | null> = {};
        const cleanedConfidence: Record<string, number> = {};
        for (const [key, value] of Object.entries(res.extraction.extracted_fields)) {
          if (value !== null && value !== undefined && String(value).trim() !== '' && String(value).toLowerCase() !== 'n/a' && String(value).toLowerCase() !== 'not found') {
            cleanedFields[key] = value;
            cleanedConfidence[key] = res.extraction.confidence?.[key] ?? 0;
          }
        }
        setExtraction({
          ...res.extraction,
          extracted_fields: cleanedFields,
          confidence: cleanedConfidence,
        });
      } else {
        // Real API failed — show error, do NOT inject fake data
        setExtractionError(
          res.error ||
          'AI document extraction is currently unavailable. Please fill in the form manually.'
        );
      }
    } catch {
      // Network or other error — show error, do NOT inject fake data
      setExtractionError(
        'Could not connect to the AI service. Please ensure the backend is running, then try again.'
      );
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyAutofill = (appliedFields: Record<string, string>) => {
    onChange({ ...formData, ...appliedFields });
    setExtraction(null);
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
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <User size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Step 1 of 6
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--heading-color)', margin: 0, fontWeight: 700 }}>
            {section.title}
          </h2>
          {section.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              {section.description}
            </p>
          )}
        </div>
      </div>

      {/* AI Autofill Prompt Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366F1'
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--heading-color)' }}>
              AI Auto-Fill from Identity Proof
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Upload Aadhaar, PAN, Voter ID, or Passport to auto-populate applicant details with AI assistance.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isExtracting ? 'not-allowed' : 'pointer',
              opacity: isExtracting ? 0.7 : 1,
            }}
          >
            {isExtracting ? (
              <>
                <Loader2 size={14} className="spin-animation" /> Extracting with AI...
              </>
            ) : (
              <>
                <Upload size={14} /> Upload ID & Auto-Fill
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Extraction Error Banner */}
      {extractionError && !isExtracting && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#D97706',
            fontSize: '0.85rem',
          }}
        >
          <WifiOff size={17} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>AI Extraction Unavailable</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{extractionError}</div>
          </div>
          <button
            type="button"
            onClick={() => setExtractionError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', flexShrink: 0, padding: '0.1rem' }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Autofill Review & Edit Panel */}
      {extraction && (
        <AIAutofillPanel
          extraction={extraction}
          fieldMapping={ID_FIELD_MAPPING}
          onApply={handleApplyAutofill}
          onDismiss={() => setExtraction(null)}
          currentFormValues={formData}
        />
      )}

      {/* Form Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}
          className="wizard-form-grid"
        >
          {section.fields.map((field) => {
            const fieldId = `field-${field.name}`;
            const isFullWidth = field.type === 'textarea' || field.name === 'address';
            const fieldError = errors[field.name];

            return (
              <div
                key={field.name}
                id={fieldId}
                style={{
                  gridColumn: isFullWidth ? '1 / -1' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <label
                  htmlFor={`input-${field.name}`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: fieldError ? '#F87171' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>{field.label}</span>
                  {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    id={`input-${field.name}`}
                    name={field.name}
                    rows={field.rows || 3}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: fieldError ? '1px solid #EF4444' : '1px solid var(--input-border)',
                      color: 'var(--input-text)',
                      fontFamily: 'inherit',
                      fontSize: '0.925rem',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`input-${field.name}`}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: fieldError ? '1px solid #EF4444' : '1px solid var(--input-border)',
                      color: formData[field.name] ? 'var(--input-text)' : 'var(--text-secondary)',
                      fontFamily: 'inherit',
                      fontSize: '0.925rem',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value} style={{ background: 'var(--input-bg)', color: 'var(--input-text)' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`input-${field.name}`}
                    name={field.name}
                    type={field.type === 'telephone' ? 'tel' : field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: fieldError ? '1px solid #EF4444' : '1px solid var(--input-border)',
                      color: 'var(--input-text)',
                      fontFamily: 'inherit',
                      fontSize: '0.925rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                )}

                {fieldError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#F87171',
                      fontSize: '0.78rem'
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>{fieldError}</span>
                  </div>
                )}
              </div>
            );
          })}
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
          border: '1px solid var(--border-accent)'
        }}
      >
        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          Fields marked <span style={{ color: '#EF4444', fontWeight: 700 }}>*</span> are required
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1ApplicantInfo;
