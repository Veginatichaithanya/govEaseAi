import { apiClient } from './apiClient';

export interface AdminDashboardStats {
  citizens: number;
  officers: number;
  active_officers: number;
  inactive_officers: number;
  departments: number;
  active_departments: number;
  services: number;
  active_services: number;
  applications: {
    total: number;
    draft: number;
    submitted: number;
    under_review: number;
    correction_requested: number;
    resubmitted: number;
    approved: number;
    rejected: number;
  };
  documents: {
    total: number;
    verified: number;
    pending: number;
    needs_correction: number;
  };
  ai: {
    analyses: number;
    successful: number;
    failed: number;
  };
  conversations: number;
  messages: number;
  notifications: number;
  unread_notifications: number;
  by_department: Array<{
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
  by_service: Array<{
    serviceId: string;
    serviceName: string;
    departmentId: string;
    total: number;
  }>;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard/stats');
  if (res.ok && res.data) {
    return res.data;
  }
  return null;
}
