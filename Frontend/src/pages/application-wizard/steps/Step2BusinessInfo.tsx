import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Save, AlertCircle, Building } from 'lucide-react';
import {
  TRADE_LICENSE_FORM_CONFIG,
  validateFormSections,
  validateField,
  type FormFieldConfig
} from '../../../config/formConfig';

interface Step2Props {
  formData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  isSaving: boolean;
}

const section = TRADE_LICENSE_FORM_CONFIG.sections[1]; // Business Info section

export const Step2BusinessInfo: React.FC<Step2Props> = ({
  formData,
  onChange,
  onNext,
  onBack,
  onSaveDraft,
  isSaving
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: FormFieldConfig, value: any) => {
    onChange({ ...formData, [field.name]: value });
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
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Building size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#22D3EE', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Step 2 of 6
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
        >
          {section.fields.map((field) => {
            const fieldId = `field-${field.name}`;
            const isFullWidth = field.type === 'textarea' || field.name === 'businessAddress';
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
                    min={field.min}
                    max={field.max}
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
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

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

export default Step2BusinessInfo;
