/**
 * AIAutofillPanel — shown when AI extracts fields from a document.
 * Citizens review, edit, or dismiss each AI-suggested field.
 * AI values are NEVER auto-applied without explicit citizen confirmation.
 */
import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  Edit3,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import type { ExtractionResult } from '../services/aiMultimodalService';

interface FieldSuggestion {
  fieldKey: string;
  fieldLabel: string;
  aiValue: string | null;
  confidence: number;
  currentValue?: string;
  accepted: boolean;
  editing: boolean;
  editValue: string;
}

interface AIAutofillPanelProps {
  extraction: ExtractionResult;
  /** Map from AI field keys to form field keys + labels */
  fieldMapping: Record<string, { formKey: string; label: string }>;
  onApply: (fields: Record<string, string>) => void;
  onDismiss: () => void;
  currentFormValues?: Record<string, string>;
}

export const AIAutofillPanel: React.FC<AIAutofillPanelProps> = ({
  extraction,
  fieldMapping,
  onApply,
  onDismiss,
  currentFormValues = {},
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Build initial field suggestions from extraction
  const buildSuggestions = (): FieldSuggestion[] => {
    const suggestions: FieldSuggestion[] = [];
    for (const [aiKey, mapping] of Object.entries(fieldMapping)) {
      const aiValue = extraction.extracted_fields?.[aiKey];
      const confidence = extraction.confidence?.[aiKey] ?? 0;
      if (aiValue !== undefined && aiValue !== null) {
        suggestions.push({
          fieldKey: aiKey,
          fieldLabel: mapping.label,
          aiValue,
          confidence,
          currentValue: currentFormValues[mapping.formKey],
          accepted: false,
          editing: false,
          editValue: aiValue ?? '',
        });
      }
    }
    return suggestions;
  };

  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>(buildSuggestions);

  const toggleAccept = (key: string) => {
    setSuggestions(prev =>
      prev.map(s => s.fieldKey === key ? { ...s, accepted: !s.accepted, editing: false } : s)
    );
  };

  const startEdit = (key: string) => {
    setSuggestions(prev =>
      prev.map(s => s.fieldKey === key ? { ...s, editing: true, editValue: s.aiValue ?? '' } : s)
    );
  };

  const saveEdit = (key: string, value: string) => {
    setSuggestions(prev =>
      prev.map(s => s.fieldKey === key ? { ...s, editing: false, editValue: value, aiValue: value, accepted: true } : s)
    );
  };

  const handleApplyAll = () => {
    const toApply: Record<string, string> = {};
    for (const sug of suggestions.filter(s => s.accepted && s.aiValue)) {
      const mapping = fieldMapping[sug.fieldKey];
      if (mapping) toApply[mapping.formKey] = sug.aiValue!;
    }
    onApply(toApply);
  };

  const acceptedCount = suggestions.filter(s => s.accepted).length;
  const hasLowConfidence = suggestions.some(s => s.confidence < 0.6 && s.confidence > 0);

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(99,102,241,0.35)',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.04) 100%)',
      overflow: 'hidden',
      marginTop: '1rem',
    }}>
      {/* Header */}
      <div
        style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: isCollapsed ? 'none' : '1px solid rgba(99,102,241,0.15)' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={18} color="#6366F1" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            AI Extraction Suggestions
          </span>
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.15)', color: '#6366F1', fontWeight: 600 }}>
            {suggestions.length} field{suggestions.length !== 1 ? 's' : ''}
          </span>
          {extraction.document_type && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>• {extraction.document_type}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" onClick={e => { e.stopPropagation(); onDismiss(); }}
            style={{ padding: '0.25rem', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} title="Dismiss">
            <X size={16} />
          </button>
          {isCollapsed ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronUp size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Disclaimer */}
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(6,182,212,0.06)', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <Info size={12} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span>AI-extracted values are suggestions only. Review, edit, or reject each before applying. AI does not make government decisions.</span>
          </div>

          {/* Warnings */}
          {(hasLowConfidence || extraction.warnings?.length > 0) && (
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(234,179,8,0.06)', borderBottom: '1px solid rgba(234,179,8,0.15)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.72rem', color: '#D97706' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                {hasLowConfidence && 'Some values have low confidence — verify carefully. '}
                {extraction.warnings?.join(' ')}
              </span>
            </div>
          )}

          {/* Field list */}
          <div style={{ padding: '0.5rem' }}>
            {suggestions.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No matchable fields found in this document.
              </div>
            )}
            {suggestions.map(sug => (
              <div key={sug.fieldKey} style={{
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.35rem',
                background: sug.accepted ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)',
                border: `1px solid ${sug.accepted ? 'rgba(34,197,94,0.25)' : 'var(--border-subtle)'}`,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'start',
                gap: '0.5rem',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sug.fieldLabel}</span>
                    {sug.confidence > 0 && (
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        background: sug.confidence >= 0.8 ? 'rgba(34,197,94,0.12)' : sug.confidence >= 0.6 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)',
                        color: sug.confidence >= 0.8 ? '#16A34A' : sug.confidence >= 0.6 ? '#D97706' : '#DC2626',
                        fontWeight: 600,
                      }}>
                        {Math.round(sug.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {sug.editing ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        defaultValue={sug.editValue}
                        autoFocus
                        style={{ flex: 1, padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-accent)', background: 'var(--input-bg)', color: 'var(--input-text)', fontSize: '0.8rem', outline: 'none' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(sug.fieldKey, (e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') setSuggestions(prev => prev.map(s => s.fieldKey === sug.fieldKey ? { ...s, editing: false } : s));
                        }}
                        id={`edit-${sug.fieldKey}`}
                      />
                      <button type="button" onClick={() => {
                        const val = (document.getElementById(`edit-${sug.fieldKey}`) as HTMLInputElement)?.value;
                        saveEdit(sug.fieldKey, val ?? sug.aiValue ?? '');
                      }} style={{ padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', background: '#2563EB', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', border: 'none' }}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {sug.aiValue || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'inherit' }}>Not detected</span>}
                    </div>
                  )}

                  {sug.currentValue && sug.aiValue && sug.currentValue !== sug.aiValue && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Current: <span style={{ color: 'var(--text-secondary)' }}>{sug.currentValue}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  {!sug.editing && (
                    <button type="button" onClick={() => startEdit(sug.fieldKey)}
                      style={{ padding: '0.3rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'transparent' }}
                      title="Edit value">
                      <Edit3 size={13} />
                    </button>
                  )}
                  <button type="button" onClick={() => toggleAccept(sug.fieldKey)}
                    style={{
                      padding: '0.3rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: sug.accepted ? '#16A34A' : 'var(--border-subtle)',
                      background: sug.accepted ? 'rgba(34,197,94,0.12)' : 'transparent',
                      color: sug.accepted ? '#16A34A' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                    {sug.accepted ? <><CheckCircle2 size={12} /> Accepted</> : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button"
              onClick={() => setSuggestions(prev => prev.map(s => ({ ...s, accepted: true })))}
              style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent' }}>
              Accept All
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onDismiss} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}>
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleApplyAll}
                disabled={acceptedCount === 0}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem', opacity: acceptedCount === 0 ? 0.5 : 1 }}
              >
                <Sparkles size={13} />
                Apply {acceptedCount > 0 ? `${acceptedCount} Field${acceptedCount > 1 ? 's' : ''}` : 'Fields'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAutofillPanel;
