import { apiClient } from '../services/apiClient';

export interface OfficerActivityItem {
  id: string;
  departmentId: string;
  applicationId: string;
  applicantName: string;
  serviceName: string;
  actionType:
    | 'APPLICATION_SUBMITTED'
    | 'MOVED_TO_REVIEW'
    | 'CORRECTION_REQUESTED'
    | 'APPLICATION_APPROVED'
    | 'APPLICATION_REJECTED';
  description: string;
  timestamp: string;
  officerName?: string;
}

const ACTIVITIES_STORAGE_KEY = 'goveaseai_officer_activities';

function getStoredActivities(): OfficerActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read activities from storage:', err);
  }
  return [];
}

export const MOCK_OFFICER_ACTIVITIES: OfficerActivityItem[] = getStoredActivities();

export function getOfficerActivitiesByDepartment(departmentId: string): OfficerActivityItem[] {
  // Sync live activities from PostgreSQL backend
  apiClient.get<OfficerActivityItem[]>(`/officer/activities?departmentId=${encodeURIComponent(departmentId)}`).then((res) => {
    if (res.ok && Array.isArray(res.data)) {
      try {
        localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(res.data));
      } catch {}
      MOCK_OFFICER_ACTIVITIES.length = 0;
      MOCK_OFFICER_ACTIVITIES.push(...res.data);
      window.dispatchEvent(new CustomEvent('govease_activities_updated', { detail: res.data }));
    }
  }).catch((err) => {
    console.warn('Failed to sync officer activities from API:', err);
  });

  const stored = getStoredActivities();
  const current = stored.length > 0 ? stored : MOCK_OFFICER_ACTIVITIES;
  return current.filter((act) => act.departmentId === departmentId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
