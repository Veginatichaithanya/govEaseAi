import { apiClient } from '../services/apiClient';

export interface RequiredDocument {
  id: string;
  name: string;
  required: boolean;
  description: string;
  type?: string;
}

export type ServiceCategory = 'Business' | 'Construction' | 'Industry' | 'Environment';

export interface GovernmentService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  shortDescription: string;
  eligibility: string[];
  fee: string;
  processingTime: string;
  estimatedTime?: string;
  requiredDocuments: RequiredDocument[];
  applicationSteps: string[];
  active: boolean;
  department: string;
  iconName: 'Building' | 'Store' | 'Briefcase' | 'Hammer' | 'Factory' | 'ShieldCheck';
}

export const STANDARD_APPLICATION_STEPS: string[] = [
  '1. Select Service',
  '2. Provide Application Details',
  '3. Upload Required Documents',
  '4. AI Document Analysis',
  '5. AI Verification',
  '6. Review Application',
  '7. Submit Application',
  '8. Officer Review',
  '9. Digital Approval'
];

export const DEFAULT_SERVICES: GovernmentService[] = [
  {
    id: 'trade-license',
    name: 'Trade License',
    category: 'Business',
    description: 'Statutory municipal authorization required for commercial, retail, and mercantile operations within municipal limits.',
    shortDescription: 'Municipal trade license for retail & commercial establishments',
    fee: '₹ 2,500 / annum',
    processingTime: '3 - 5 Working Days',
    estimatedTime: '3 - 5 Working Days',
    department: 'Municipal Licensing Division',
    iconName: 'Store',
    active: true,
    eligibility: [
      'Age 18 years or older with valid identity proof',
      'Proprietor, partner, or authorized company director',
      'Possession of commercial premises within municipal corporation limits',
      'No pending municipal tax arrears on the property'
    ],
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card / Government Identity Proof', required: true, description: 'National identity verification proof of proprietor or director' },
      { id: 'pan', name: 'PAN Card of Business / Individual', required: true, description: 'Permanent Account Number issued by Income Tax Department' },
      { id: 'lease_deed', name: 'Commercial Rental Agreement or Ownership Deed', required: true, description: 'Registered lease agreement or property ownership deed' },
      { id: 'property_tax', name: 'Latest Municipal Property Tax Receipt', required: true, description: 'Proof of cleared municipal tax assessment for current financial year' },
      { id: 'fire_noc', name: 'Fire Safety Clearance (NOC)', required: false, description: 'NOC from Fire Department for commercial areas exceeding 500 sq ft' }
    ],
    applicationSteps: STANDARD_APPLICATION_STEPS
  },
  {
    id: 'shop-registration',
    name: 'Shop Registration',
    category: 'Business',
    description: 'Mandatory statutory registration under the Shops and Commercial Establishments Act governing working hours, employee welfare, and service terms.',
    shortDescription: 'Registration under the State Shops & Commercial Establishments Act',
    fee: '₹ 1,200',
    processingTime: '2 - 4 Working Days',
    estimatedTime: '2 - 4 Working Days',
    department: 'Department of Labour & Employment',
    iconName: 'Briefcase',
    active: true,
    eligibility: [
      'Commercial shop, office, or service enterprise within the state',
      'Application must be filed within 30 days of commencement of business',
      'Applicable to sole proprietors, partnerships, and companies'
    ],
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card of Employer / Applicant', required: true, description: 'Identity proof of proprietor or authorized representative' },
      { id: 'pan', name: 'Business PAN Card', required: true, description: 'Tax identification certificate' },
      { id: 'address_proof', name: 'Shop Premises Electricity Bill / Rental Agreement', required: true, description: 'Recent utility bill or notarized rent agreement' },
      { id: 'employee_list', name: 'List of Employees & Designation Details', required: false, description: 'Summary sheet of staff employed and wage terms' }
    ],
    applicationSteps: STANDARD_APPLICATION_STEPS
  },
  {
    id: 'business-license',
    name: 'Business License',
    category: 'Business',
    description: 'Comprehensive commercial operating sanction issued by the municipal administration for enterprise operations, warehousing, and wholesale trade.',
    shortDescription: 'General commercial operation license for enterprises and distributors',
    fee: '₹ 5,000 / annum',
    processingTime: '5 - 7 Working Days',
    estimatedTime: '5 - 7 Working Days',
    department: 'Industries & Commerce Department',
    iconName: 'Building',
    active: true,
    eligibility: [
      'Registered corporate entity, LLP, or partnership firm',
      'Valid GSTIN registration in the operational district',
      'Premises compliant with zonal master plan regulations'
    ],
    requiredDocuments: [
      { id: 'incorporation', name: 'Certificate of Incorporation / Partnership Deed', required: true, description: 'Official company registration certificate' },
      { id: 'gstin', name: 'GST Registration Certificate', required: true, description: 'Valid GSTIN documentation' },
      { id: 'lease_agreement', name: 'Registered Lease or Title Deed', required: true, description: 'Valid tenancy or property ownership documentation' },
      { id: 'board_res', name: 'Board Resolution / Power of Attorney', required: true, description: 'Authorization letter for designated signatory' }
    ],
    applicationSteps: STANDARD_APPLICATION_STEPS
  },
  {
    id: 'building-permission',
    name: 'Building Permission',
    category: 'Construction',
    description: 'Sanction and structural approval for new construction, addition, alteration, or reconstruction under the Municipal Building Bye-Laws.',
    shortDescription: 'Urban planning sanction for commercial and residential constructions',
    fee: '₹ 12,500',
    processingTime: '7 - 14 Working Days',
    estimatedTime: '7 - 14 Working Days',
    department: 'Town Planning & Urban Development Authority',
    iconName: 'Hammer',
    active: true,
    eligibility: [
      'Registered owner of the plot or lawful power-of-attorney holder',
      'Plot situated in approved layout conforming to Master Plan zoning',
      'No legal disputes or encumbrances pending on the subject land'
    ],
    requiredDocuments: [
      { id: 'title_deed', name: 'Registered Sale Deed / Title Documents', required: true, description: 'Legal ownership deed for the plot' },
      { id: 'encumbrance', name: 'Encumbrance Certificate (13 Years)', required: true, description: 'Sub-registrar encumbrance record showing clear title' },
      { id: 'blueprint', name: 'Architect-Certified Building Plans & Elevations', required: true, description: 'Scale architectural drawing signed by registered architect' },
      { id: 'structural_cert', name: 'Structural Stability Certificate', required: true, description: 'Certified design calculations by licensed structural engineer' }
    ],
    applicationSteps: STANDARD_APPLICATION_STEPS
  },
  {
    id: 'factory-registration',
    name: 'Factory Registration',
    category: 'Industry',
    description: 'Statutory licensing and regulatory clearance under the Factories Act for manufacturing plants employing power and industrial machinery.',
    shortDescription: 'Statutory manufacturing license for industrial production units',
    fee: '₹ 8,000 / annum',
    processingTime: '10 - 15 Working Days',
    estimatedTime: '10 - 15 Working Days',
    department: 'Directorate of Factories & Boilers',
    iconName: 'Factory',
    active: true,
    eligibility: [
      'Manufacturing establishment with 10+ workers using electric power or 20+ workers without power',
      'Land located within designated industrial zone or industrial park',
      'Installation compliant with industrial safety regulations'
    ],
    requiredDocuments: [
      { id: 'factory_plan', name: 'Factory Site & Machinery Layout Plan', required: true, description: 'Detailed layout of machines, exits, ventilation, and power points' },
      { id: 'machinery_list', name: 'Machinery Specification & Total Horsepower (HP)', required: true, description: 'List of all installed motors and total connected electric load' },
      { id: 'pollution_cte', name: 'Consent to Establish (CTE) from Pollution Board', required: true, description: 'Environmental clearance certificate' },
      { id: 'fire_clearance', name: 'Industrial Fire & Safety Clearance', required: true, description: 'Certified fire safety mitigation measures' }
    ],
    applicationSteps: STANDARD_APPLICATION_STEPS
  },
  {
    id: 'pollution-certificate',
    name: 'Pollution Certificate',
    category: 'Environment',
    description: 'Statutory environmental Consent to Establish (CTE) & Consent to Operate (CTO) issued by the State Pollution Control Board under Air & Water Acts.',
    shortDescription: 'Environmental emission and effluent discharge compliance certificate',
    fee: '₹ 4,000',
    processingTime: '5 - 10 Working Days',
    estimatedTime: '5 - 10 Working Days',
    department: 'State Pollution Control Board',
    iconName: 'ShieldCheck',
    active: true,
    eligibility: [
      'Industrial or commercial enterprise generating air emissions, trade effluent, or hazardous waste',
      'Adequate pollution control / effluent treatment mechanisms in place',
      'Premises positioned outside protected ecological sensitive buffer zones'
    ],
    requiredDocuments: [
      { id: 'process_flow', name: 'Industrial Process Flow & Material Balance Sheet', required: true, description: 'Flow diagram showing inputs, outputs, emissions, and waste' },
      { id: 'etp_scheme', name: 'Effluent Treatment Plant (ETP) / STP Layout Scheme', required: true, description: 'Technical design of sewage or effluent neutralization unit' },
      { id: 'site_plan', name: 'Site Plan with Distance to Water Bodies & Habitats', required: true, description: 'Topographical map showing ecological buffer distances' }
    ],
    applicationSteps: STANDARD_APPLICATION_STEPS
  }
];

const SERVICES_CACHE_KEY = 'goveaseai_services_cache';

function getStoredServices(): GovernmentService[] {
  try {
    const raw = localStorage.getItem(SERVICES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read services cache:', err);
  }
  return DEFAULT_SERVICES;
}

// Live services list initialized with default mock services
export const MOCK_SERVICES: GovernmentService[] = getStoredServices();
if (MOCK_SERVICES.length === 0) {
  MOCK_SERVICES.push(...DEFAULT_SERVICES);
}

export async function fetchServicesFromAPI(): Promise<GovernmentService[]> {
  try {
    const res = await apiClient.get<GovernmentService[]>('/services');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      try {
        localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(res.data));
      } catch {}
      MOCK_SERVICES.length = 0;
      MOCK_SERVICES.push(...res.data);
      window.dispatchEvent(new CustomEvent('govease_services_updated', { detail: res.data }));
      return res.data;
    }
  } catch (err) {
    console.warn('Failed to fetch services from API:', err);
  }
  return MOCK_SERVICES;
}

// Immediately trigger background sync with PostgreSQL on module load
fetchServicesFromAPI();

export const servicesService = {
  async getServices(): Promise<GovernmentService[]> {
    return fetchServicesFromAPI();
  },

  getServicesSync(): GovernmentService[] {
    if (MOCK_SERVICES.length === 0) {
      const stored = getStoredServices();
      if (stored.length > 0) {
        MOCK_SERVICES.length = 0;
        MOCK_SERVICES.push(...stored);
      }
    }
    return MOCK_SERVICES;
  },

  getServiceById(id: string): GovernmentService | undefined {
    return MOCK_SERVICES.find((s) => s.id === id);
  }
};

export interface ApplicationTrackingStatus {
  applicationNumber: string;
  serviceId: string;
  serviceName: string;
  applicantName: string;
  submissionDate: string;
  currentStage: string;
  overallStatus: 'AI-assisted review' | 'Under Officer Scrutiny' | 'Approved' | 'Action Required';
  stages: {
    id: number;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
    badge?: string;
  }[];
  extractedData: {
    field: string;
    extractedValue: string;
    formValue: string;
    matchStatus: 'match' | 'review_required' | 'unverified';
    note: string;
  }[];
}

export const MOCK_TRACKING_SAMPLE: ApplicationTrackingStatus = {
  applicationNumber: 'GEAI-2026-000001',
  serviceId: 'trade-license',
  serviceName: 'Trade License (Commercial Retail)',
  applicantName: 'Ravi Kumar',
  submissionDate: '12 Sep 2026',
  currentStage: 'Officer Review & Verification Analysis',
  overallStatus: 'AI-assisted review',
  stages: [
    { id: 1, title: 'Application Submitted', description: 'Citizen submitted form details and required proofs.', status: 'completed' },
    { id: 2, title: 'Documents Processed', description: 'Multimodal OCR extracted text and structural tokens.', status: 'completed' },
    { id: 3, title: 'AI Verification Completed', description: 'Cross-checked applicant details against uploaded certificates.', status: 'completed', badge: 'AI-assisted result' },
    { id: 4, title: 'Officer Review', description: 'Municipal licensing officer assessing AI pre-validation report.', status: 'current', badge: 'Human Authority' },
    { id: 5, title: 'Decision & Sanction', description: 'Authorized officer approves, requests clarification, or denies.', status: 'pending' },
    { id: 6, title: 'Digital Approval Issued', description: 'Cryptographically signed trade license delivered to citizen portal.', status: 'pending' }
  ],
  extractedData: [
    { field: 'Applicant Full Name', extractedValue: 'Ravi Kumar', formValue: 'Ravi Kumar', matchStatus: 'match', note: 'Exact match with Aadhaar OCR' },
    { field: 'Identification Number', extractedValue: 'XXXX-XXXX-1234', formValue: 'XXXX-XXXX-1234', matchStatus: 'match', note: 'Checksum passed' },
    { field: 'Registered Address', extractedValue: 'Plot 42, Jubilee Hills, Hyderabad 500033', formValue: 'Flat 42B, Road 10, Jubilee Hills, Hyderabad', matchStatus: 'review_required', note: 'Subtle discrepancy between rental deed and application form. Officer review advised.' },
    { field: 'Commercial Floor Area', extractedValue: '650 sq ft', formValue: '650 sq ft', matchStatus: 'match', note: 'Consistent with floor layout plan' },
    { field: 'Fire Safety NOC Validity', extractedValue: 'Valid until 31-Dec-2027', formValue: 'Valid', matchStatus: 'match', note: 'Within authorized validity period' }
  ]
};
