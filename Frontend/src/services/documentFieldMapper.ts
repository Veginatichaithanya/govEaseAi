/**
 * GovEaseAI Document-to-Form Field Mapper
 *
 * Maps OCR-extracted fields from Indian government documents (Aadhaar, PAN, etc.)
 * to application form field names defined in formConfig.ts.
 *
 * This module is intentionally isolated so a real AI-based mapper can replace it later.
 */

import type { ExtractionResult } from './aiMultimodalService';

export interface MappedField {
  formKey: string;
  label: string;
  value: string;
  confidence: number;
  source: string; // e.g. "PAN Card", "Aadhaar Card"
}

/**
 * Maps structured_fields from OCR result to application form field names.
 * Returns only fields that have non-null values.
 */
export function mapOcrToFormFields(
  verificationResult: Record<string, any>,
  documentName: string
): MappedField[] {
  const mapped: MappedField[] = [];

  const structured = verificationResult?.structured_fields || {};
  const confidences = verificationResult?.confidence_scores || {};
  const entities = verificationResult?.entities || {};
  const formFields = verificationResult?.form_fields || {};
  const docType = verificationResult?.document_type || documentName || 'Document';

  // Helper: add field if value is non-null and non-empty
  const addField = (ocrKey: string, formKey: string, label: string, value?: string | null) => {
    const val = value || structured[ocrKey];
    if (val && typeof val === 'string' && val.trim() && val.trim().toLowerCase() !== 'null') {
      mapped.push({
        formKey,
        label,
        value: val.trim(),
        confidence: confidences[ocrKey] ?? 0.7,
        source: docType,
      });
    }
  };

  // ── Direct structured_fields mapping ──
  addField('full_name', 'fullName', 'Full Name');
  addField('father_name', 'fatherName', "Father's Name");
  addField('date_of_birth', 'dateOfBirth', 'Date of Birth');
  addField('email', 'email', 'Email Address');
  addField('phone_number', 'mobileNumber', 'Mobile Number');
  addField('address', 'address', 'Address');
  addField('city', 'city', 'City');
  addField('state', 'state', 'State');
  addField('postal_code', 'postalCode', 'Postal Code');
  addField('pan_number', 'panNumber', 'PAN Number');
  addField('aadhaar_number', 'aadhaarNumber', 'Aadhaar Number');
  addField('voter_id', 'voterId', 'Voter ID');
  addField('epic_number', 'voterId', 'Voter ID');
  addField('business_name', 'businessName', 'Business Name');
  addField('registration_number', 'registrationNumber', 'Registration Number');

  // ── Fallback: extract from entities if structured_fields didn't have them ──
  const existingKeys = new Set(mapped.map(m => m.formKey));

  if (!existingKeys.has('fullName') && entities.names?.length > 0) {
    addField('full_name', 'fullName', 'Full Name', entities.names[0]);
  }

  if (!existingKeys.has('email') && entities.emails?.length > 0) {
    addField('email', 'email', 'Email Address', entities.emails[0]);
  }

  if (!existingKeys.has('mobileNumber') && entities.phone_numbers?.length > 0) {
    addField('phone_number', 'mobileNumber', 'Mobile Number', entities.phone_numbers[0]);
  }

  if (!existingKeys.has('address') && entities.addresses?.length > 0) {
    addField('address', 'address', 'Address', entities.addresses[0]);
  }

  if (!existingKeys.has('dateOfBirth') && entities.dates?.length > 0) {
    // Only use first date if document type suggests it's a DOB
    const dobTypes = ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving Licence', 'Birth Certificate'];
    if (dobTypes.some(t => docType.toLowerCase().includes(t.toLowerCase()))) {
      addField('date_of_birth', 'dateOfBirth', 'Date of Birth', entities.dates[0]);
    }
  }

  // ── Fallback: extract from form_fields key-value pairs ──
  const formFieldMapping: Record<string, { key: string; label: string }> = {
    'name': { key: 'fullName', label: 'Full Name' },
    'full name': { key: 'fullName', label: 'Full Name' },
    'applicant name': { key: 'fullName', label: 'Full Name' },
    'pan': { key: 'panNumber', label: 'PAN Number' },
    'pan number': { key: 'panNumber', label: 'PAN Number' },
    'permanent account number': { key: 'panNumber', label: 'PAN Number' },
    'aadhaar': { key: 'aadhaarNumber', label: 'Aadhaar Number' },
    'aadhaar number': { key: 'aadhaarNumber', label: 'Aadhaar Number' },
    'voter id': { key: 'voterId', label: 'Voter ID' },
    'voter id number': { key: 'voterId', label: 'Voter ID' },
    'epic no': { key: 'voterId', label: 'Voter ID' },
    'epic number': { key: 'voterId', label: 'Voter ID' },
    'date of birth': { key: 'dateOfBirth', label: 'Date of Birth' },
    'dob': { key: 'dateOfBirth', label: 'Date of Birth' },
    'mobile': { key: 'mobileNumber', label: 'Mobile Number' },
    'phone': { key: 'mobileNumber', label: 'Mobile Number' },
    'email': { key: 'email', label: 'Email' },
    'address': { key: 'address', label: 'Address' },
    'city': { key: 'city', label: 'City' },
    'state': { key: 'state', label: 'State' },
    'pin': { key: 'postalCode', label: 'Postal Code' },
    'pincode': { key: 'postalCode', label: 'Postal Code' },
    'postal code': { key: 'postalCode', label: 'Postal Code' },
    'business name': { key: 'businessName', label: 'Business Name' },
    'establishment name': { key: 'businessName', label: 'Business Name' },
    'trade name': { key: 'businessName', label: 'Business Name' },
  };

  const finalKeys = new Set(mapped.map(m => m.formKey));
  for (const [rawKey, rawValue] of Object.entries(formFields)) {
    const normalizedKey = rawKey.toLowerCase().trim();
    const mapping = formFieldMapping[normalizedKey];
    if (mapping && !finalKeys.has(mapping.key) && rawValue && typeof rawValue === 'string') {
      mapped.push({
        formKey: mapping.key,
        label: mapping.label,
        value: rawValue.trim(),
        confidence: 0.65,
        source: docType,
      });
      finalKeys.add(mapping.key);
    }
  }

  return mapped;
}

/**
 * Builds the fieldMapping prop required by AIAutofillPanel
 * from an array of MappedField results.
 */
export function buildAutofillMapping(
  fields: MappedField[]
): Record<string, { formKey: string; label: string }> {
  const mapping: Record<string, { formKey: string; label: string }> = {};
  for (const f of fields) {
    mapping[f.formKey] = { formKey: f.formKey, label: f.label };
  }
  return mapping;
}

/**
 * Converts MappedField[] to an ExtractionResult-compatible format
 * for use with the existing AIAutofillPanel component.
 */
export function mappedFieldsToExtractionResult(
  fields: MappedField[],
  documentType?: string
): ExtractionResult {
  const extracted_fields: Record<string, string | null> = {};
  const confidence: Record<string, number> = {};

  for (const f of fields) {
    extracted_fields[f.formKey] = f.value;
    confidence[f.formKey] = f.confidence;
  }

  return {
    document_type: documentType || fields[0]?.source || 'Document',
    extracted_fields,
    confidence,
    warnings: [],
    missing_fields: [],
    needs_human_review: true,
  };
}
