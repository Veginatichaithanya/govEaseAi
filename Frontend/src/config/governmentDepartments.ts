// Centralized Government Department Configuration & Service Mapping for GovEaseAI

export type DepartmentPermission =
  | 'VIEW_APPLICATIONS'
  | 'VIEW_DOCUMENTS'
  | 'REVIEW_APPLICATION'
  | 'REQUEST_CORRECTION'
  | 'REJECT_APPLICATION'
  | 'APPROVE_APPLICATION'
  | 'ISSUE_DIGITAL_LICENSE';

export interface OfficerAccount {
  officerId: string;
  officerName: string;
  email: string;
  password: string; // Demo evaluation credential
  role: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  serviceIds: string[];
  permissions: DepartmentPermission[];
}

export interface GovernmentDepartment {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  serviceIds: string[];
  serviceName: string; // Primary statutory service
  category: 'Business' | 'Construction' | 'Industry' | 'Environment';
  description: string;
  dashboardRoute: string;
  defaultOfficer: OfficerAccount;
  permissions: DepartmentPermission[];
  statutoryAct: string;
}

export const ALL_OFFICER_PERMISSIONS: DepartmentPermission[] = [
  'VIEW_APPLICATIONS',
  'VIEW_DOCUMENTS',
  'REVIEW_APPLICATION',
  'REQUEST_CORRECTION',
  'REJECT_APPLICATION',
  'APPROVE_APPLICATION',
  'ISSUE_DIGITAL_LICENSE'
];

export const DEMO_OFFICER_PASSWORD = 'Officer@123';

export const GOVERNMENT_DEPARTMENTS: Record<string, GovernmentDepartment> = {
  'municipal-licensing': {
    departmentId: 'municipal-licensing',
    departmentName: 'Municipal Licensing Division',
    departmentCode: 'MLD',
    serviceIds: ['trade-license', 'shop-registration'],
    serviceName: 'Trade License',
    category: 'Business',
    description: 'Statutory regulation of municipal trades, retail establishments, and local commerce permits.',
    dashboardRoute: '/officer/dashboard',
    statutoryAct: 'Municipal Corporations Act, Sec 443 (Commercial Operations)',
    permissions: ALL_OFFICER_PERMISSIONS,
    defaultOfficer: {
      officerId: 'OFF-MLD-001',
      officerName: 'S. Narayanan',
      email: 'licensing@goveaseai.gov',
      password: 'License@123',
      role: 'Senior Licensing Officer',
      departmentId: 'municipal-licensing',
      departmentName: 'Municipal Licensing Division',
      departmentCode: 'MLD',
      serviceIds: ['trade-license', 'shop-registration'],
      permissions: ALL_OFFICER_PERMISSIONS
    }
  },
  'department-labour': {
    departmentId: 'department-labour',
    departmentName: 'Department of Labour',
    departmentCode: 'DOL',
    serviceIds: ['shop-registration'],
    serviceName: 'Shop Registration',
    category: 'Business',
    description: 'Enforcement of statutory working conditions, shop certifications, and commercial labor welfare.',
    dashboardRoute: '/officer/dashboard',
    statutoryAct: 'Shops and Commercial Establishments Act, Sec 3',
    permissions: ALL_OFFICER_PERMISSIONS,
    defaultOfficer: {
      officerId: 'OFF-DOL-002',
      officerName: 'P. Ramesh Babu',
      email: 'labour@goveaseai.gov',
      password: 'Labour@123',
      role: 'Labour Enforcement Officer',
      departmentId: 'department-labour',
      departmentName: 'Department of Labour',
      departmentCode: 'DOL',
      serviceIds: ['shop-registration'],
      permissions: ALL_OFFICER_PERMISSIONS
    }
  },
  'directorate-industries': {
    departmentId: 'directorate-industries',
    departmentName: 'Directorate of Industries',
    departmentCode: 'DOI',
    serviceIds: ['business-license'],
    serviceName: 'Business License',
    category: 'Business',
    description: 'Licensing, facilitation, and MSME commercial authorization under state industrial development charters.',
    dashboardRoute: '/officer/dashboard',
    statutoryAct: 'State Industrial Enterprises Promotion & Regulatory Act',
    permissions: ALL_OFFICER_PERMISSIONS,
    defaultOfficer: {
      officerId: 'OFF-DOI-003',
      officerName: 'K. Ananya Sharma',
      email: 'industry@goveaseai.gov',
      password: 'Industry@123',
      role: 'Industries Promotion Officer',
      departmentId: 'directorate-industries',
      departmentName: 'Directorate of Industries',
      departmentCode: 'DOI',
      serviceIds: ['business-license'],
      permissions: ALL_OFFICER_PERMISSIONS
    }
  },
  'urban-development': {
    departmentId: 'urban-development',
    departmentName: 'Urban Development & Town Planning',
    departmentCode: 'UDTP',
    serviceIds: ['building-permission'],
    serviceName: 'Building Permission',
    category: 'Construction',
    description: 'Technical appraisal of structural layouts, master plan zoning compliance, and construction permits.',
    dashboardRoute: '/officer/dashboard',
    statutoryAct: 'Urban Development & Master Plan Town Planning Statutory Code',
    permissions: ALL_OFFICER_PERMISSIONS,
    defaultOfficer: {
      officerId: 'OFF-UDTP-004',
      officerName: 'M. Venkat Reddy',
      email: 'building@goveaseai.gov',
      password: 'Building@123',
      role: 'Town Planning Officer',
      departmentId: 'urban-development',
      departmentName: 'Urban Development & Town Planning',
      departmentCode: 'UDTP',
      serviceIds: ['building-permission'],
      permissions: ALL_OFFICER_PERMISSIONS
    }
  },
  'inspectorate-factories': {
    departmentId: 'inspectorate-factories',
    departmentName: 'Inspectorate of Factories',
    departmentCode: 'IOF',
    serviceIds: ['factory-registration'],
    serviceName: 'Factory Registration',
    category: 'Industry',
    description: 'Industrial safety appraisal, plant machinery clearance, hazardous process control, and factory licensing.',
    dashboardRoute: '/officer/dashboard',
    statutoryAct: 'Factories Act, Sec 6 (Plan Approval & Registration)',
    permissions: ALL_OFFICER_PERMISSIONS,
    defaultOfficer: {
      officerId: 'OFF-IOF-005',
      officerName: 'G. Harish Chandra',
      email: 'factory@goveaseai.gov',
      password: 'Factory@123',
      role: 'Factory Licensing Officer',
      departmentId: 'inspectorate-factories',
      departmentName: 'Inspectorate of Factories',
      departmentCode: 'IOF',
      serviceIds: ['factory-registration'],
      permissions: ALL_OFFICER_PERMISSIONS
    }
  },
  'pollution-control': {
    departmentId: 'pollution-control',
    departmentName: 'Pollution Control Board',
    departmentCode: 'PCB',
    serviceIds: ['pollution-certificate'],
    serviceName: 'Pollution Certificate',
    category: 'Environment',
    description: 'Environmental scrutiny, effluent/emission standards assessment, Consent to Operate (CTO) statutory issuance.',
    dashboardRoute: '/officer/dashboard',
    statutoryAct: 'Water & Air (Prevention & Control of Pollution) Acts',
    permissions: ALL_OFFICER_PERMISSIONS,
    defaultOfficer: {
      officerId: 'OFF-PCB-006',
      officerName: 'Dr. S. Radhika',
      email: 'pollution@goveaseai.gov',
      password: 'Pollution@123',
      role: 'Pollution Control Officer',
      departmentId: 'pollution-control',
      departmentName: 'Pollution Control Board',
      departmentCode: 'PCB',
      serviceIds: ['pollution-certificate'],
      permissions: ALL_OFFICER_PERMISSIONS
    }
  }
};

// Department list array for dropdown rendering
export const DEPARTMENT_OPTIONS = Object.values(GOVERNMENT_DEPARTMENTS);

// Lookup helpers
export function getDepartmentById(departmentId: string): GovernmentDepartment | undefined {
  return GOVERNMENT_DEPARTMENTS[departmentId];
}

export function getDepartmentByServiceId(serviceId: string): GovernmentDepartment | undefined {
  return DEPARTMENT_OPTIONS.find((dept) => dept.serviceIds.includes(serviceId));
}

export function getDepartmentByOfficerEmail(email: string): GovernmentDepartment | undefined {
  const normalized = email.trim().toLowerCase();
  return DEPARTMENT_OPTIONS.find(
    (dept) => dept.defaultOfficer.email.toLowerCase() === normalized
  );
}

export function getOfficerAccountByEmail(email: string): OfficerAccount | undefined {
  const dept = getDepartmentByOfficerEmail(email);
  return dept?.defaultOfficer;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  officer?: OfficerAccount;
}

export function validateOfficerCredentials(
  departmentId: string,
  email: string,
  password?: string
): ValidationResult {
  const dept = getDepartmentById(departmentId);
  if (!dept) {
    return {
      isValid: false,
      errorMessage: 'Please select an authorized government department.'
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const matchedDept = getDepartmentByOfficerEmail(normalizedEmail);

  if (!matchedDept) {
    return {
      isValid: false,
      errorMessage: 'Officer account with this email was not found in the government directory.'
    };
  }

  if (matchedDept.departmentId !== departmentId) {
    return {
      isValid: false,
      errorMessage: 'These credentials are not assigned to the selected department.'
    };
  }

  // Check password if provided
  if (password !== undefined && password !== matchedDept.defaultOfficer.password) {
    return {
      isValid: false,
      errorMessage: 'Invalid officer authentication credentials.'
    };
  }

  return {
    isValid: true,
    officer: matchedDept.defaultOfficer
  };
}
