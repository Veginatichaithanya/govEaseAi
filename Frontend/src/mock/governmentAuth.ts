/**
 * Government Officer Authentication Service
 * Handles role-based login for 7 officer types.
 * Tries backend first, falls back to mock credentials when backend is offline.
 */

import { apiClient, setAuthToken, clearAuthToken } from '../services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────

export type GovernmentRole =
  | 'SUPER_ADMIN'
  | 'LICENSING_OFFICER'
  | 'BUILDING_OFFICER'
  | 'INDUSTRY_OFFICER'
  | 'ENVIRONMENT_OFFICER'
  | 'HEALTH_OFFICER'
  | 'REVENUE_OFFICER';

export interface GovernmentOfficer {
  id: string;
  fullName: string;
  email: string;
  role: GovernmentRole;
  roleDisplayName: string;
  department: string;
  designation: string;
  mobile?: string;
  dashboardRoute: string;
  serviceIds: string[];
  permissions: string[];
}

// ── Role Config ───────────────────────────────────────────────────────────

export const ROLE_DISPLAY_NAMES: Record<GovernmentRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  LICENSING_OFFICER: 'Licensing Officer',
  BUILDING_OFFICER: 'Building Officer',
  INDUSTRY_OFFICER: 'Industry Officer',
  ENVIRONMENT_OFFICER: 'Environment Officer',
  HEALTH_OFFICER: 'Health Officer',
  REVENUE_OFFICER: 'Revenue Officer',
};

export const ROLE_DASHBOARD_ROUTES: Record<GovernmentRole, string> = {
  SUPER_ADMIN: '/government/admin-dashboard',
  LICENSING_OFFICER: '/government/licensing-dashboard',
  BUILDING_OFFICER: '/government/building-dashboard',
  INDUSTRY_OFFICER: '/government/industry-dashboard',
  ENVIRONMENT_OFFICER: '/government/environment-dashboard',
  HEALTH_OFFICER: '/government/health-dashboard',
  REVENUE_OFFICER: '/government/revenue-dashboard',
};

export const ROLE_SERVICE_IDS: Record<GovernmentRole, string[]> = {
  SUPER_ADMIN: [
    'trade-license', 'shop-registration', 'business-license',
    'building-permission', 'factory-registration', 'pollution-certificate'
  ],
  LICENSING_OFFICER: ['trade-license', 'shop-registration'],
  BUILDING_OFFICER: ['building-permission'],
  INDUSTRY_OFFICER: ['factory-registration', 'business-license'],
  ENVIRONMENT_OFFICER: ['pollution-certificate'],
  HEALTH_OFFICER: [],
  REVENUE_OFFICER: [],
};

export const ROLE_DEPARTMENT_FILTER: Record<GovernmentRole, string[]> = {
  SUPER_ADMIN: [],
  LICENSING_OFFICER: ['municipal-licensing', 'department-labour'],
  BUILDING_OFFICER: ['urban-development'],
  INDUSTRY_OFFICER: ['inspectorate-factories', 'directorate-industries'],
  ENVIRONMENT_OFFICER: ['pollution-control'],
  HEALTH_OFFICER: [],
  REVENUE_OFFICER: [],
};

// ── Mock Demo Accounts & Role Passwords (matching DB seed) ─────────────────
export const DEMO_ROLE_CREDENTIALS: Record<string, { roleName: string; passwordHint: string }> = {
  'admin@goveaseai.gov': { roleName: 'Super Admin', passwordHint: 'Admin@123' },
  'licensing@goveaseai.gov': { roleName: 'Licensing Officer', passwordHint: 'License@123' },
  'building@goveaseai.gov': { roleName: 'Building Officer', passwordHint: 'Building@123' },
  'industry@goveaseai.gov': { roleName: 'Industry Officer', passwordHint: 'Industry@123' },
  'environment@goveaseai.gov': { roleName: 'Environment Officer', passwordHint: 'Environment@123' },
  'health@goveaseai.gov': { roleName: 'Health Officer', passwordHint: 'Health@123' },
  'revenue@goveaseai.gov': { roleName: 'Revenue Officer', passwordHint: 'Revenue@123' },
};

const MOCK_OFFICERS: Record<string, GovernmentOfficer> = {
  'admin@goveaseai.gov': {
    id: 'GOV-ADMIN-001',
    fullName: 'Dr. A. Krishnamurthy',
    email: 'admin@goveaseai.gov',
    role: 'SUPER_ADMIN',
    roleDisplayName: 'Super Admin',
    department: 'Administration & IT',
    designation: 'Chief Digital Officer',
    mobile: '+91 99001 10001',
    dashboardRoute: '/government/admin-dashboard',
    serviceIds: ROLE_SERVICE_IDS['SUPER_ADMIN'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION',
      'ISSUE_DIGITAL_LICENSE', 'MANAGE_OFFICERS', 'VIEW_ALL_DEPARTMENTS', 'VIEW_ANALYTICS'
    ],
  },
  'licensing@goveaseai.gov': {
    id: 'GOV-LIC-002',
    fullName: 'S. Narayanan',
    email: 'licensing@goveaseai.gov',
    role: 'LICENSING_OFFICER',
    roleDisplayName: 'Licensing Officer',
    department: 'Municipal Licensing Division',
    designation: 'Senior Licensing Officer',
    mobile: '+91 99001 10002',
    dashboardRoute: '/government/licensing-dashboard',
    serviceIds: ROLE_SERVICE_IDS['LICENSING_OFFICER'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION', 'ISSUE_DIGITAL_LICENSE'
    ],
  },
  'building@goveaseai.gov': {
    id: 'GOV-BLD-003',
    fullName: 'M. Venkat Reddy',
    email: 'building@goveaseai.gov',
    role: 'BUILDING_OFFICER',
    roleDisplayName: 'Building Officer',
    department: 'Urban Development & Town Planning',
    designation: 'Town Planning Officer',
    mobile: '+91 99001 10003',
    dashboardRoute: '/government/building-dashboard',
    serviceIds: ROLE_SERVICE_IDS['BUILDING_OFFICER'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION', 'ISSUE_DIGITAL_LICENSE'
    ],
  },
  'industry@goveaseai.gov': {
    id: 'GOV-IND-004',
    fullName: 'K. Ananya Sharma',
    email: 'industry@goveaseai.gov',
    role: 'INDUSTRY_OFFICER',
    roleDisplayName: 'Industry Officer',
    department: 'Directorate of Industries',
    designation: 'Industries Promotion Officer',
    mobile: '+91 99001 10004',
    dashboardRoute: '/government/industry-dashboard',
    serviceIds: ROLE_SERVICE_IDS['INDUSTRY_OFFICER'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION', 'ISSUE_DIGITAL_LICENSE'
    ],
  },
  'environment@goveaseai.gov': {
    id: 'GOV-ENV-005',
    fullName: 'Dr. S. Radhika',
    email: 'environment@goveaseai.gov',
    role: 'ENVIRONMENT_OFFICER',
    roleDisplayName: 'Environment Officer',
    department: 'Pollution Control Board',
    designation: 'Pollution Control Officer',
    mobile: '+91 99001 10005',
    dashboardRoute: '/government/environment-dashboard',
    serviceIds: ROLE_SERVICE_IDS['ENVIRONMENT_OFFICER'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION', 'ISSUE_DIGITAL_LICENSE'
    ],
  },
  'health@goveaseai.gov': {
    id: 'GOV-HLT-006',
    fullName: 'Dr. P. Meenakshi',
    email: 'health@goveaseai.gov',
    role: 'HEALTH_OFFICER',
    roleDisplayName: 'Health Officer',
    department: 'Department of Health & Family Welfare',
    designation: 'Health Licensing Officer',
    mobile: '+91 99001 10006',
    dashboardRoute: '/government/health-dashboard',
    serviceIds: ROLE_SERVICE_IDS['HEALTH_OFFICER'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION', 'ISSUE_DIGITAL_LICENSE'
    ],
  },
  'revenue@goveaseai.gov': {
    id: 'GOV-REV-007',
    fullName: 'B. Subrahmanyam',
    email: 'revenue@goveaseai.gov',
    role: 'REVENUE_OFFICER',
    roleDisplayName: 'Revenue Officer',
    department: 'Revenue & Stamps Department',
    designation: 'Revenue Assessment Officer',
    mobile: '+91 99001 10007',
    dashboardRoute: '/government/revenue-dashboard',
    serviceIds: ROLE_SERVICE_IDS['REVENUE_OFFICER'],
    permissions: [
      'VIEW_APPLICATIONS', 'VIEW_DOCUMENTS', 'REVIEW_APPLICATION',
      'REQUEST_CORRECTION', 'REJECT_APPLICATION', 'APPROVE_APPLICATION', 'ISSUE_DIGITAL_LICENSE'
    ],
  },
};

// ── Storage Key ──────────────────────────────────────────────────────────

const GOVT_SESSION_KEY = 'govease_govt_session';
const GOVT_TOKEN_KEY = 'govease_govt_token';

// ── Auth Service ──────────────────────────────────────────────────────────

export const governmentAuth = {
  getCurrentOfficer(): GovernmentOfficer | null {
    try {
      const stored = localStorage.getItem(GOVT_SESSION_KEY);
      return stored ? (JSON.parse(stored) as GovernmentOfficer) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(GOVT_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return this.getCurrentOfficer() !== null;
  },

  hasRole(role: GovernmentRole): boolean {
    const officer = this.getCurrentOfficer();
    return officer?.role === role;
  },

  isAuthorizedForService(serviceId: string): boolean {
    const officer = this.getCurrentOfficer();
    if (!officer) return false;
    if (officer.role === 'SUPER_ADMIN') return true;
    return officer.serviceIds.includes(serviceId);
  },

  async login(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; officer?: GovernmentOfficer; error?: string }> {
    const normalized = email.trim().toLowerCase();

    // 1. Try real backend
    try {
      const res = await apiClient.post('/government/login', { email: normalized, password, rememberMe });
      if (res.ok && res.data?.token) {
        const token = res.data.token;
        const raw = res.data.officer;

        const officer: GovernmentOfficer = {
          id: raw.id,
          fullName: raw.fullName,
          email: raw.email,
          role: raw.role as GovernmentRole,
          roleDisplayName: raw.roleDisplayName,
          department: raw.department || '',
          designation: raw.designation || '',
          mobile: raw.mobile,
          dashboardRoute: raw.dashboardRoute,
          serviceIds: raw.serviceIds || [],
          permissions: raw.permissions || [],
        };

        localStorage.setItem(GOVT_SESSION_KEY, JSON.stringify(officer));
        localStorage.setItem(GOVT_TOKEN_KEY, token);
        setAuthToken(token);
        return { success: true, officer };
      }

      if (res.status >= 400 && res.status < 500) {
        return { success: false, error: res.error || 'Invalid email or password.' };
      }
      return {
        success: false,
        error: res?.error || 'Invalid email or password.'
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the Government Officer Portal backend.'
      };
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(GOVT_SESSION_KEY);
      localStorage.removeItem(GOVT_TOKEN_KEY);
      clearAuthToken();
    } catch {
      // safe
    }
  },
};

// Export mock list for login page hints
export const MOCK_OFFICER_LIST = Object.values(MOCK_OFFICERS);
