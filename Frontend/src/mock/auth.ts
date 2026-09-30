import {
  type OfficerAccount,
  type DepartmentPermission,
  validateOfficerCredentials
} from '../config/governmentDepartments';
import { apiClient, setAuthToken, clearAuthToken, getAuthToken } from '../services/apiClient';

export interface AuthUser {
  id: string;
  name: string;
  fullName: string;
  email: string;
  mobile?: string;
  phone?: string;
  role: 'citizen' | 'officer';
  applicantId?: string;
  profileCompletion?: number;
  department?: string;
  departmentId?: string;
  officerTitle?: string;
}

export interface OfficerUser {
  officerId: string;
  officerName: string;
  email: string;
  role: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  serviceIds: string[];
  permissions: DepartmentPermission[];
}

const CITIZEN_AUTH_STORAGE_KEY = 'govease_auth_user';
const OFFICER_AUTH_STORAGE_KEY = 'govease_officer_session';

// Citizen authentication service (backed by FastAPI + PostgreSQL)
export const authService = {
  getCurrentUser(): AuthUser | null {
    try {
      const token = getAuthToken();
      if (!token) {
        localStorage.removeItem(CITIZEN_AUTH_STORAGE_KEY);
        return null;
      }
      const stored = localStorage.getItem(CITIZEN_AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        const realName = parsed.fullName || parsed.name;
        if (realName) {
          parsed.fullName = realName;
          parsed.name = realName;
        }
        return parsed;
      }
    } catch {
      // safe fallback
    }
    return null;
  },

  async loginAsync(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const cleanIdent = email.trim();
      const cleanPass = password.trim();
      const res = await apiClient.post('/auth/login', {
        identifier: cleanIdent,
        email: cleanIdent,
        password: cleanPass,
        role: 'CITIZEN'
      });

      if (res.ok && (res.data?.token || res.data?.access_token)) {
        const token = res.data.token || res.data.access_token;
        setAuthToken(token);
        const raw = res.data.user;
        const realName = raw.fullName || raw.full_name || raw.name;
        const user: AuthUser = {
          id: raw.id,
          name: realName,
          fullName: realName,
          email: raw.email,
          mobile: raw.phone || raw.mobile,
          phone: raw.phone || raw.mobile,
          role: (raw.role?.toLowerCase() as 'citizen' | 'officer') || 'citizen',
          applicantId: raw.applicantId || raw.applicant_id,
          profileCompletion: raw.profileCompletion ?? 45,
          department: raw.departmentName,
          departmentId: raw.departmentId
        };
        localStorage.setItem(CITIZEN_AUTH_STORAGE_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event('govease_auth_change'));
        return { success: true, user };
      }

      // Backend returned error (e.g. 401 Unauthorized, 403 Deactivated)
      return {
        success: false,
        error: res.error || 'Invalid phone number/email or password.'
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the server. Please try again.'
      };
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(CITIZEN_AUTH_STORAGE_KEY);
      localStorage.removeItem('goveaseai_applications');
      localStorage.removeItem('goveaseai_notifications');
      clearAuthToken();
      window.dispatchEvent(new Event('govease_auth_change'));
    } catch {
      // safe fallback
    }
  },

  async signupAsync(
    fullName: string,
    email: string,
    mobile: string,
    password: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await apiClient.post('/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim()
      });

      if (res.ok) {
        return { success: true, message: res.data?.message || 'Account created successfully.' };
      }

      // Map status codes to friendly messages
      if (res.status === 409) {
        return { success: false, error: res.error || 'An account with this email or mobile already exists.' };
      }
      if (res.status === 422) {
        return { success: false, error: res.error || 'Please check your input and try again.' };
      }

      return {
        success: false,
        error: res.error || 'Failed to create account. Please try again.'
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the server. Please try again.'
      };
    }
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  isCitizen(): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.role === 'citizen';
  },

  isOfficer(): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.role === 'officer';
  }
};

// Department-Aware Government Officer Authentication Service
export const officerAuth = {
  getCurrentOfficer(): OfficerUser | null {
    try {
      const stored = localStorage.getItem(OFFICER_AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as OfficerUser;
      }
    } catch {
      // safe fallback
    }
    return null;
  },

  loginOfficer(
    departmentId: string,
    email: string,
    password?: string
  ): { success: boolean; officer?: OfficerUser; error?: string } {
    const validation = validateOfficerCredentials(departmentId, email, password);

    if (!validation.isValid || !validation.officer) {
      return {
        success: false,
        error: validation.errorMessage || 'Authentication failed. Please verify your credentials.'
      };
    }

    const account: OfficerAccount = validation.officer;
    const officerUser: OfficerUser = {
      officerId: account.officerId,
      officerName: account.officerName,
      email: account.email,
      role: account.role,
      departmentId: account.departmentId,
      departmentName: account.departmentName,
      departmentCode: account.departmentCode,
      serviceIds: account.serviceIds,
      permissions: account.permissions
    };

    try {
      localStorage.setItem(OFFICER_AUTH_STORAGE_KEY, JSON.stringify(officerUser));
    } catch (err) {
      console.error('Failed to store officer session:', err);
      return {
        success: false,
        error: 'Unable to initialize secure officer session storage.'
      };
    }

    // Connect to PostgreSQL FastAPI officer auth endpoint
    apiClient.post('/auth/officer/login', {
      department: departmentId,
      email,
      password: password || 'License@123'
    }).then((res) => {
      if (res.ok && (res.data?.access_token || res.data?.token)) {
        setAuthToken(res.data.access_token || res.data.token);
      }
    }).catch((err) => {
      console.warn('Backend officer login sync notice:', err);
    });

    return {
      success: true,
      officer: officerUser
    };
  },

  async loginOfficerAsync(
    departmentId: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; officer?: OfficerUser; error?: string }> {
    try {
      const res = await apiClient.post('/auth/officer/login', {
        department: departmentId,
        email,
        password
      });

      if (res.ok && (res.data?.access_token || res.data?.token)) {
        const token = res.data.access_token || res.data.token;
        setAuthToken(token);
        const u = res.data.user;
        const officerUser: OfficerUser = {
          officerId: u.id,
          officerName: u.fullName || u.name,
          email: u.email,
          role: u.designation || u.officerTitle || 'Government Officer',
          departmentId: u.departmentId || departmentId,
          departmentName: u.department || u.departmentName || '',
          departmentCode: u.departmentCode || '',
          serviceIds: u.serviceIds || [],
          permissions: u.permissions || []
        };
        localStorage.setItem(OFFICER_AUTH_STORAGE_KEY, JSON.stringify(officerUser));
        return { success: true, officer: officerUser };
      }

      return {
        success: false,
        error: res.error || 'Authentication failed. Please verify your credentials.'
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the Government Officer Portal backend.'
      };
    }
  },

  logoutOfficer(): void {
    try {
      localStorage.removeItem(OFFICER_AUTH_STORAGE_KEY);
      clearAuthToken();
    } catch {
      // safe fallback
    }
  },

  isOfficerAuthenticated(): boolean {
    return this.getCurrentOfficer() !== null;
  },

  hasOfficerPermission(permission: DepartmentPermission): boolean {
    const officer = this.getCurrentOfficer();
    if (!officer) return false;
    return officer.permissions.includes(permission);
  },

  isOfficerAuthorizedForService(serviceId: string): boolean {
    const officer = this.getCurrentOfficer();
    if (!officer) return false;
    return officer.serviceIds.includes(serviceId);
  },

  isOfficerAuthorizedForDepartment(departmentId: string): boolean {
    const officer = this.getCurrentOfficer();
    if (!officer) return false;
    return officer.departmentId === departmentId;
  }
};
