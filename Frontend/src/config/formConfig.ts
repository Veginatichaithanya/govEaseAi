export interface FormFieldOption {
  label: string;
  value: string;
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'telephone'
  | 'date'
  | 'number'
  | 'textarea'
  | 'select';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  rows?: number;
  helpText?: string;
  min?: number;
  max?: number;
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface ServiceFormConfig {
  sections: FormSectionConfig[];
}

export const INDIAN_STATES: FormFieldOption[] = [
  { label: 'Select State / UT', value: '' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Delhi (NCT)', value: 'Delhi' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Odisha', value: 'Odisha' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Rajasthan', value: 'Rajasthan' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'West Bengal', value: 'West Bengal' },
  { label: 'Other State / UT', value: 'Other' }
];

export const BUSINESS_TYPES: FormFieldOption[] = [
  { label: 'Select Business Type', value: '' },
  { label: 'Sole Proprietorship', value: 'Sole Proprietorship' },
  { label: 'Partnership', value: 'Partnership' },
  { label: 'Private Limited Company', value: 'Private Limited Company' },
  { label: 'Public Limited Company', value: 'Public Limited Company' },
  { label: 'Other', value: 'Other' }
];

export const BUSINESS_CATEGORIES: FormFieldOption[] = [
  { label: 'Select Business Category', value: '' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Food & Beverage', value: 'Food & Beverage' },
  { label: 'Services', value: 'Services' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Wholesale', value: 'Wholesale' },
  { label: 'Other', value: 'Other' }
];

export const TRADE_LICENSE_FORM_CONFIG: ServiceFormConfig = {
  sections: [
    {
      id: 'applicant-info',
      title: 'Section 1 — Applicant Information',
      description: 'Official personal identification and residential details of the primary applicant.',
      fields: [
        {
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. Ravi Kumar'
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          placeholder: 'e.g. ravi.kumar@example.com'
        },
        {
          name: 'mobileNumber',
          label: 'Mobile Number',
          type: 'telephone',
          required: true,
          placeholder: '10-digit mobile number, e.g. 9876543210'
        },
        {
          name: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: false,
          placeholder: 'DD-MM-YYYY'
        },
        {
          name: 'address',
          label: 'Address',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Enter your residential address including door/flat number, street, and landmark.'
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
          required: true,
          placeholder: 'e.g. Hyderabad'
        },
        {
          name: 'state',
          label: 'State',
          type: 'select',
          required: true,
          options: INDIAN_STATES
        },
        {
          name: 'postalCode',
          label: 'Postal Code',
          type: 'text',
          required: true,
          placeholder: '6-digit PIN code, e.g. 500001'
        }
      ]
    },
    {
      id: 'business-info',
      title: 'Section 2 — Business Information',
      description: 'Establishment details, premises classification, and operational scope.',
      fields: [
        {
          name: 'businessName',
          label: 'Business Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. Sri Krishna Enterprises'
        },
        {
          name: 'businessType',
          label: 'Business Type',
          type: 'select',
          required: true,
          options: BUSINESS_TYPES
        },
        {
          name: 'businessCategory',
          label: 'Business Category',
          type: 'select',
          required: true,
          options: BUSINESS_CATEGORIES
        },
        {
          name: 'businessAddress',
          label: 'Business Address',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Physical address of the operating commercial enterprise/shop.'
        },
        {
          name: 'businessCity',
          label: 'Business City',
          type: 'text',
          required: true,
          placeholder: 'e.g. Hyderabad'
        },
        {
          name: 'businessState',
          label: 'Business State',
          type: 'select',
          required: true,
          options: INDIAN_STATES
        },
        {
          name: 'businessPostalCode',
          label: 'Business Postal Code',
          type: 'text',
          required: true,
          placeholder: '6-digit PIN code, e.g. 500003'
        },
        {
          name: 'businessStartDate',
          label: 'Business Start Date',
          type: 'date',
          required: false,
          placeholder: 'DD-MM-YYYY'
        },
        {
          name: 'numberOfEmployees',
          label: 'Number of Employees',
          type: 'number',
          required: false,
          min: 0,
          placeholder: 'e.g. 5'
        }
      ]
    },
    {
      id: 'application-info',
      title: 'Section 3 — Application Information',
      description: 'Operational intent and supporting statutory disclosures for this application.',
      fields: [
        {
          name: 'applicationPurpose',
          label: 'Application Purpose',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Explain the purpose of this trade license application (e.g., New retail establishment license)'
        },
        {
          name: 'businessDescription',
          label: 'Business Description',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Brief summary of commercial goods traded or services rendered.'
        },
        {
          name: 'additionalInformation',
          label: 'Additional Information',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Any special remarks or municipal zone clearance notes (optional).'
        }
      ]
    }
  ]
};

// Generic fallback form configuration for other services so all services operate smoothly
export const GENERIC_SERVICE_FORM_CONFIG: ServiceFormConfig = {
  sections: [
    {
      id: 'applicant-info',
      title: 'Section 1 — Applicant Information',
      description: 'Official personal identification and residential details of the primary applicant.',
      fields: [
        {
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. Ravi Kumar'
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          placeholder: 'e.g. ravi.kumar@example.com'
        },
        {
          name: 'mobileNumber',
          label: 'Mobile Number',
          type: 'telephone',
          required: true,
          placeholder: '10-digit mobile number, e.g. 9876543210'
        },
        {
          name: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: false,
          placeholder: 'DD-MM-YYYY'
        },
        {
          name: 'address',
          label: 'Address',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Enter residential address.'
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
          required: true,
          placeholder: 'e.g. Hyderabad'
        },
        {
          name: 'state',
          label: 'State',
          type: 'select',
          required: true,
          options: INDIAN_STATES
        },
        {
          name: 'postalCode',
          label: 'Postal Code',
          type: 'text',
          required: true,
          placeholder: '6-digit PIN code, e.g. 500001'
        }
      ]
    },
    {
      id: 'entity-info',
      title: 'Section 2 — Entity & Establishment Information',
      description: 'Commercial establishment or facility location and classification.',
      fields: [
        {
          name: 'businessName',
          label: 'Establishment / Entity Name',
          type: 'text',
          required: true,
          placeholder: 'Official name of the premises or entity'
        },
        {
          name: 'businessType',
          label: 'Entity Type',
          type: 'select',
          required: true,
          options: BUSINESS_TYPES
        },
        {
          name: 'businessCategory',
          label: 'Operating Category',
          type: 'select',
          required: true,
          options: BUSINESS_CATEGORIES
        },
        {
          name: 'businessAddress',
          label: 'Premises Address',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Complete physical location of the facility or establishment.'
        },
        {
          name: 'businessCity',
          label: 'City',
          type: 'text',
          required: true,
          placeholder: 'e.g. Hyderabad'
        },
        {
          name: 'businessState',
          label: 'State',
          type: 'select',
          required: true,
          options: INDIAN_STATES
        },
        {
          name: 'businessPostalCode',
          label: 'Postal Code',
          type: 'text',
          required: true,
          placeholder: '6-digit PIN code, e.g. 500003'
        },
        {
          name: 'businessStartDate',
          label: 'Operation Commencement Date',
          type: 'date',
          required: false,
          placeholder: 'DD-MM-YYYY'
        },
        {
          name: 'numberOfEmployees',
          label: 'Total Personnel / Employees',
          type: 'number',
          required: false,
          min: 0,
          placeholder: 'e.g. 10'
        }
      ]
    },
    {
      id: 'application-info',
      title: 'Section 3 — Application Information',
      description: 'Specific application declaration and operational overview.',
      fields: [
        {
          name: 'applicationPurpose',
          label: 'Application Purpose',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'State the primary regulatory purpose of this application.'
        },
        {
          name: 'businessDescription',
          label: 'Operations Summary',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Summary of ongoing or proposed operations.'
        },
        {
          name: 'additionalInformation',
          label: 'Additional Information',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Any further declarations or notes (optional).'
        }
      ]
    }
  ]
};

export const serviceFormConfigMap: Record<string, ServiceFormConfig> = {
  'trade-license': TRADE_LICENSE_FORM_CONFIG,
  'shop-registration': GENERIC_SERVICE_FORM_CONFIG,
  'business-license': GENERIC_SERVICE_FORM_CONFIG,
  'building-permission': GENERIC_SERVICE_FORM_CONFIG,
  'factory-registration': GENERIC_SERVICE_FORM_CONFIG,
  'pollution-certificate': GENERIC_SERVICE_FORM_CONFIG
};

export function getServiceFormConfig(serviceId: string): ServiceFormConfig {
  return serviceFormConfigMap[serviceId] || GENERIC_SERVICE_FORM_CONFIG;
}

/**
 * Validates a single form field value based on field configuration.
 * Returns an error message string or null if valid.
 */
export function validateField(field: FormFieldConfig, value: any): string | null {
  const valStr = value !== undefined && value !== null ? String(value).trim() : '';

  // Required Check
  if (field.required && !valStr) {
    return `${field.label} is required.`;
  }

  if (!valStr) {
    return null; // optional and empty is valid
  }

  // Email format validation
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valStr)) {
      return 'Please enter a valid email address.';
    }
  }

  // Telephone / mobile number validation (Indian 10-digit mobile standard or valid format)
  if (field.type === 'telephone') {
    const cleanNumber = valStr.replace(/\D/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 12) {
      return 'Please enter a valid 10-digit mobile number.';
    }
  }

  // Postal code validation (Indian 6-digit PIN code)
  if (field.name.toLowerCase().includes('postal') || field.name.toLowerCase().includes('pin')) {
    const cleanPin = valStr.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return 'Please enter a valid 6-digit postal code.';
    }
  }

  // Number validation
  if (field.type === 'number') {
    const num = Number(valStr);
    if (isNaN(num)) {
      return `${field.label} must be a valid number.`;
    }
    if (field.min !== undefined && num < field.min) {
      return `${field.label} cannot be less than ${field.min}.`;
    }
    if (field.max !== undefined && num > field.max) {
      return `${field.label} cannot exceed ${field.max}.`;
    }
  }

  return null;
}

/**
 * Validates all fields within all sections.
 * Returns a dictionary mapping field name to error message.
 */
export function validateFormSections(
  sections: FormSectionConfig[],
  formData: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const section of sections) {
    for (const field of section.fields) {
      const error = validateField(field, formData[field.name]);
      if (error) {
        errors[field.name] = error;
      }
    }
  }

  return errors;
}
