import { apiClient, getAuthToken } from '../services/apiClient';
import { getDepartmentByServiceId } from '../config/governmentDepartments';

export interface FieldMetadata {
  source: 'MANUAL' | 'AI_EXTRACTED';
  confidence?: number;
}

export interface DocumentUpload {
  documentId: string;
  documentName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'ERROR';
  uploadedAt: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AI_PROCESSING'
  | 'OFFICER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DIGITAL_APPROVAL';

export interface ApplicationRecord {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  status: ApplicationStatus;
  currentStep: number;
  formData: Record<string, any>;
  fieldMetadata: Record<string, FieldMetadata>;
  uploadedDocuments: DocumentUpload[];
  createdAt: string;
  updatedAt: string;
  departmentId?: string;
  department?: string;
  remarks?: string;
  approvalReference?: string;
  approvalDate?: string;
  submittedAt?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  priority?: 'High' | 'Medium' | 'Normal';
  aiVerificationSummary?: string;
  officerRemarks?: string;
  officerDecidedBy?: string;
  officerDecidedAt?: string;
}

const STORAGE_KEY = 'goveaseai_applications';

export const INITIAL_MOCK_APPLICATIONS: ApplicationRecord[] = [];

function getStoredApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read applications from storage:', err);
  }
  return [];
}

function saveStoredApplications(apps: ApplicationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error('Failed to write applications to storage:', err);
  }
}

export function mergeApplicationsIntoStorage(serverApps: ApplicationRecord[]): void {
  try {
    const local = getStoredApplications();
    const map = new Map<string, ApplicationRecord>();
    for (const app of local) {
      map.set(app.id, app);
    }
    for (const s of serverApps) {
      map.set(s.id, s);
    }
    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('govease_applications_updated', { detail: merged }));
  } catch (err) {
    console.warn('Failed to merge applications into storage:', err);
  }
}

function generateNextApplicationId(apps: ApplicationRecord[]): string {
  let maxNumber = 0;
  const regex = /GEAI-2026-(\d+)/;

  for (const app of apps) {
    const match = app.id.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNum = maxNumber + 1;
  const padded = String(nextNum).padStart(6, '0');
  return `GEAI-2026-${padded}`;
}

// Initial sync with PostgreSQL only when token exists
if (getAuthToken()) {
  apiClient.get<ApplicationRecord[]>('/applications').then((res) => {
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      mergeApplicationsIntoStorage(res.data);
    }
  }).catch(() => {});
}

export const applicationService = {
  getApplications(): ApplicationRecord[] {
    // Trigger background sync from FastAPI PostgreSQL endpoint
    apiClient.get<ApplicationRecord[]>('/applications').then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        mergeApplicationsIntoStorage(res.data);
      }
    }).catch(() => {});

    return getStoredApplications();
  },

  getApplicationsByUser(userId: string): ApplicationRecord[] {
    // Trigger background sync for citizen applications
    apiClient.get<ApplicationRecord[]>('/applications').then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        mergeApplicationsIntoStorage(res.data);
      }
    }).catch(() => {});

    const stored = getStoredApplications();
    return stored.filter((app) => app.userId === userId);
  },

  getApplicationsByDepartment(departmentId: string): ApplicationRecord[] {
    // Trigger background sync for officer applications
    apiClient.get<ApplicationRecord[]>(`/officer/applications?departmentId=${encodeURIComponent(departmentId)}`).then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        mergeApplicationsIntoStorage(res.data);
      }
    }).catch(() => {});

    return getStoredApplications().filter((app) => app.departmentId === departmentId);
  },

  /**
   * Filter applications by a list of service IDs.
   * Used by role-based government dashboards (e.g. Licensing Officer → trade-license + shop-registration).
   * Pass an empty array to get ALL applications (Super Admin).
   */
  getApplicationsByServiceIds(serviceIds: string[]): ApplicationRecord[] {
    // Trigger background sync
    apiClient.get<ApplicationRecord[]>('/officer/applications').then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        mergeApplicationsIntoStorage(res.data);
      }
    }).catch(() => {});

    const stored = getStoredApplications();
    if (serviceIds.length === 0) return stored; // Super Admin sees all
    return stored.filter((app) => serviceIds.includes(app.serviceId));
  },



  getApplicationById(applicationId: string): ApplicationRecord | null {
    const apps = getStoredApplications();
    const found = apps.find((app) => app.id === applicationId) || null;

    apiClient.get<ApplicationRecord>(`/applications/${applicationId}`).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch(() => {});

    return found;
  },

  getDraftByUserAndService(userId: string, serviceId: string): ApplicationRecord | null {
    const apps = getStoredApplications();
    return (
      apps.find(
        (app) => app.userId === userId && app.serviceId === serviceId && app.status === 'DRAFT'
      ) || null
    );
  },

  createApplication(
    userId: string,
    serviceId: string,
    serviceName: string,
    initialFormData: Record<string, any> = {}
  ): ApplicationRecord {
    const existingDraft = this.getDraftByUserAndService(userId, serviceId);
    if (existingDraft) {
      return existingDraft;
    }

    const apps = getStoredApplications();
    const newId = generateNextApplicationId(apps);
    const now = new Date().toISOString();

    const fieldMetadata: Record<string, FieldMetadata> = {};
    for (const key of Object.keys(initialFormData)) {
      fieldMetadata[key] = { source: 'MANUAL' };
    }

    const targetDept = getDepartmentByServiceId(serviceId);

    const newApp: ApplicationRecord = {
      id: newId,
      userId: userId || 'demo-citizen-001',
      serviceId,
      serviceName,
      status: 'DRAFT',
      currentStep: 1,
      departmentId: targetDept?.departmentId || 'municipal-licensing',
      department: targetDept?.departmentName || 'Municipal Licensing Division',
      formData: initialFormData,
      fieldMetadata,
      uploadedDocuments: [],
      createdAt: now,
      updatedAt: now
    };

    apps.push(newApp);
    saveStoredApplications(apps);

    // Persist to PostgreSQL via FastAPI
    apiClient.post<ApplicationRecord>('/applications', {
      serviceId,
      initialFormData
    }).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch((err) => {
      console.warn('Backend create application sync error:', err);
    });

    return newApp;
  },

  updateApplication(applicationId: string, data: Partial<ApplicationRecord>): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    const currentApp = apps[index];
    const updatedApp: ApplicationRecord = {
      ...currentApp,
      ...data,
      updatedAt: new Date().toISOString()
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    // Sync to PostgreSQL
    apiClient.put<ApplicationRecord>(`/applications/${applicationId}`, {
      formData: data.formData,
      currentStep: data.currentStep,
      fieldMetadata: data.fieldMetadata,
      uploadedDocuments: data.uploadedDocuments
    }).catch(() => {});

    return updatedApp;
  },

  getApplicationResumeRoute(app: ApplicationRecord): string {
    const step = app.currentStep || 1;
    if (step <= 1) {
      return `/applications/new/${app.serviceId}`;
    }
    if (step === 2) {
      return `/applications/${app.id}/documents`;
    }
    if (step === 3) {
      return `/applications/${app.id}/verification`;
    }
    if (step === 4) {
      return `/applications/${app.id}/review`;
    }
    if (step === 5) {
      return `/applications/${app.id}/submit`;
    }
    return `/applications/${app.id}`;
  },

  getApplicationProgress(applicationId: string) {
    const app = this.getApplicationById(applicationId);
    const currentStep = app ? (app.currentStep || 1) : 1;

    const steps = [
      { num: 1, name: 'Application Details' },
      { num: 2, name: 'Documents' },
      { num: 3, name: 'AI Verification' },
      { num: 4, name: 'Review' },
      { num: 5, name: 'Submit' }
    ].map((s) => ({
      ...s,
      completed: s.num < currentStep,
      active: s.num === currentStep,
      locked: s.num > currentStep
    }));

    return {
      currentStep,
      totalSteps: 5,
      label: steps.find((s) => s.active)?.name || 'Application Details',
      steps
    };
  },

  saveDraft(applicationId: string, formData: Record<string, any>): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    const currentApp = apps[index];
    const updatedMetadata = { ...currentApp.fieldMetadata };

    for (const key of Object.keys(formData)) {
      if (!updatedMetadata[key]) {
        updatedMetadata[key] = { source: 'MANUAL' };
      }
    }

    const updatedApp: ApplicationRecord = {
      ...currentApp,
      formData: {
        ...currentApp.formData,
        ...formData
      },
      fieldMetadata: updatedMetadata,
      updatedAt: new Date().toISOString()
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    // Save Draft immediately in PostgreSQL
    apiClient.put<ApplicationRecord>(`/applications/${applicationId}`, {
      formData
    }).catch((err) => {
      console.warn('Backend save draft sync error:', err);
    });

    return updatedApp;
  },

  updateApplicationStep(applicationId: string, step: number): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    const updatedApp: ApplicationRecord = {
      ...apps[index],
      currentStep: step,
      updatedAt: new Date().toISOString()
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    apiClient.put<ApplicationRecord>(`/applications/${applicationId}`, {
      currentStep: step
    }).catch(() => {});

    return updatedApp;
  },

  updateDocuments(applicationId: string, documents: DocumentUpload[]): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    const updatedApp: ApplicationRecord = {
      ...apps[index],
      uploadedDocuments: documents,
      updatedAt: new Date().toISOString()
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    apiClient.put<ApplicationRecord>(`/applications/${applicationId}`, {
      uploadedDocuments: documents
    }).catch(() => {});

    return updatedApp;
  },

  submitApplication(applicationId: string): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    const current = apps[index];
    const targetDept = getDepartmentByServiceId(current.serviceId);
    const now = new Date().toISOString();

    const updatedApp: ApplicationRecord = {
      ...current,
      status: 'OFFICER_REVIEW',
      departmentId: targetDept?.departmentId || current.departmentId || 'municipal-licensing',
      department: targetDept?.departmentName || current.department || 'Municipal Licensing Division',
      currentStep: 8,
      riskLevel: current.riskLevel || 'LOW',
      aiVerificationSummary: 'Application verified and forwarded to authorized officer appraisal desk.',
      submittedAt: now,
      updatedAt: now
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    // Submit to PostgreSQL
    apiClient.post<ApplicationRecord>(`/applications/${applicationId}/submit`).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch((err) => {
      console.warn('Backend submit sync error:', err);
    });

    return updatedApp;
  },

  // Officer Decision Actions
  officerApprove(
    applicationId: string,
    officerName: string,
    remarks?: string
  ): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const current = apps[index];
    const now = new Date().toISOString();
    const todayFormatted = now.split('T')[0];
    const refCode = current.departmentId?.toUpperCase().slice(0, 3) || 'GOV';
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const approvalReference = `GEAI/${refCode}/${todayFormatted.slice(0, 4)}/${randomSuffix}`;

    const updatedApp: ApplicationRecord = {
      ...current,
      status: 'APPROVED',
      currentStep: 9,
      approvalReference,
      approvalDate: todayFormatted,
      officerRemarks: remarks || 'Application verified and approved according to statutory specifications.',
      officerDecidedBy: officerName,
      officerDecidedAt: now,
      updatedAt: now
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    // Approve in PostgreSQL
    apiClient.post<ApplicationRecord>(`/officer/applications/${applicationId}/approve`, {
      officerName,
      remarks: remarks || 'Application verified and approved according to statutory specifications.'
    }).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch((err) => {
      console.warn('Backend officer approve sync error:', err);
    });

    return updatedApp;
  },

  officerRequestCorrection(
    applicationId: string,
    officerName: string,
    remarks: string
  ): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const now = new Date().toISOString();
    const updatedApp: ApplicationRecord = {
      ...apps[index],
      status: 'CORRECTION_REQUIRED',
      remarks,
      officerRemarks: remarks,
      officerDecidedBy: officerName,
      officerDecidedAt: now,
      updatedAt: now
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    // Request Correction in PostgreSQL
    apiClient.post<ApplicationRecord>(`/officer/applications/${applicationId}/correction`, {
      officerName,
      remarks
    }).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch((err) => {
      console.warn('Backend officer request correction sync error:', err);
    });

    return updatedApp;
  },

  officerReject(
    applicationId: string,
    officerName: string,
    reason: string
  ): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const now = new Date().toISOString();
    const updatedApp: ApplicationRecord = {
      ...apps[index],
      status: 'REJECTED',
      remarks: reason,
      officerRemarks: reason,
      officerDecidedBy: officerName,
      officerDecidedAt: now,
      updatedAt: now
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);

    // Reject in PostgreSQL
    apiClient.post<ApplicationRecord>(`/officer/applications/${applicationId}/reject`, {
      officerName,
      remarks: reason
    }).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch((err) => {
      console.warn('Backend officer reject sync error:', err);
    });

    return updatedApp;
  },

  resubmitApplication(
    applicationId: string,
    updatedFormData: Record<string, any>
  ): ApplicationRecord {
    const apps = getStoredApplications();
    const index = apps.findIndex((a) => a.id === applicationId);

    if (index === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const current = apps[index];
    const now = new Date().toISOString();
    const mergedForm = { ...current.formData, ...updatedFormData };

    const updatedMetadata = { ...current.fieldMetadata };
    for (const key of Object.keys(updatedFormData)) {
      if (!updatedMetadata[key]) {
        updatedMetadata[key] = { source: 'MANUAL' };
      }
    }

    const updatedApp: ApplicationRecord = {
      ...current,
      status: 'OFFICER_REVIEW',
      currentStep: 8,
      formData: mergedForm,
      fieldMetadata: updatedMetadata,
      remarks: undefined,
      officerRemarks: undefined,
      updatedAt: now
    };

    apps[index] = updatedApp;
    saveStoredApplications(apps);
    window.dispatchEvent(new CustomEvent('govease_applications_updated', { detail: apps }));

    // Sync resubmission to PostgreSQL
    apiClient.post<ApplicationRecord>(`/applications/${applicationId}/resubmit`, {
      formData: updatedFormData
    }).then((res) => {
      if (res.ok && res.data) {
        mergeApplicationsIntoStorage([res.data]);
      }
    }).catch((err) => {
      console.warn('Backend resubmit sync error:', err);
    });

    return updatedApp;
  },

  async getApplicationTimeline(applicationId: string): Promise<Array<{
    id: string;
    actionType: string;
    description: string;
    actorName: string | null;
    timestamp: string;
  }>> {
    const res = await apiClient.get(`/applications/${applicationId}/timeline`);
    if (res.ok && Array.isArray(res.data)) {
      return res.data;
    }
    // Fallback: build basic timeline from stored application status
    const app = this.getApplicationById(applicationId);
    if (!app) return [];
    const events = [];
    if (app.createdAt) events.push({ id: '1', actionType: 'APPLICATION_CREATED', description: `Draft application created for ${app.serviceName}.`, actorName: null, timestamp: app.createdAt });
    if (app.submittedAt) events.push({ id: '2', actionType: 'APPLICATION_SUBMITTED', description: `Application ${app.id} submitted for review.`, actorName: null, timestamp: app.submittedAt });
    if (app.officerDecidedAt && app.officerRemarks) events.push({ id: '3', actionType: app.status === 'CORRECTION_REQUIRED' ? 'CORRECTION_REQUESTED' : app.status === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED', description: app.officerRemarks, actorName: app.officerDecidedBy || null, timestamp: app.officerDecidedAt });
    return events;
  },


  // Officer Dashboard Statistics
  getOfficerDashboardStats(departmentId: string) {
    const deptApps = this.getApplicationsByDepartment(departmentId);
    const total = deptApps.length;

    const pendingReview = deptApps.filter((a) =>
      ['SUBMITTED', 'AI_PROCESSING', 'OFFICER_REVIEW', 'RESUBMITTED'].includes(a.status)
    ).length;

    const correctionRequired = deptApps.filter(
      (a) => a.status === 'CORRECTION_REQUIRED'
    ).length;

    const approved = deptApps.filter((a) =>
      ['APPROVED', 'DIGITAL_APPROVAL'].includes(a.status)
    ).length;

    const rejected = deptApps.filter((a) => a.status === 'REJECTED').length;

    return {
      total,
      pendingReview,
      correctionRequired,
      approved,
      rejected
    };
  },

  getApplicationStats(userId: string) {
    const userApps = this.getApplicationsByUser(userId);
    const total = userApps.length;

    const pendingReview = userApps.filter((a) =>
      ['SUBMITTED', 'AI_PROCESSING', 'OFFICER_REVIEW', 'RESUBMITTED'].includes(a.status)
    ).length;

    const correctionRequired = userApps.filter(
      (a) => a.status === 'CORRECTION_REQUIRED'
    ).length;

    const approved = userApps.filter((a) =>
      ['APPROVED', 'DIGITAL_APPROVAL'].includes(a.status)
    ).length;

    const rejected = userApps.filter((a) => a.status === 'REJECTED').length;

    return {
      total,
      pendingReview,
      correctionRequired,
      approved,
      rejected
    };
  },

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted';
      case 'AI_PROCESSING':
        return 'AI Processing';
      case 'OFFICER_REVIEW':
        return 'Officer Review';
      case 'CORRECTION_REQUIRED':
        return 'Correction Required';
      case 'RESUBMITTED':
        return 'Resubmitted';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'DIGITAL_APPROVAL':
        return 'Digital Approval';
      default:
        return status;
    }
  },

  getStatusBadgeClass(status: ApplicationStatus): string {
    switch (status) {
      case 'APPROVED':
      case 'DIGITAL_APPROVAL':
        return 'badge-success';
      case 'CORRECTION_REQUIRED':
      case 'OFFICER_REVIEW':
        return 'badge-warning';
      case 'AI_PROCESSING':
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return 'badge-info';
      case 'REJECTED':
        return 'badge-danger';
      case 'DRAFT':
      default:
        return 'badge-neutral';
    }
  },

  getApplicationPriority(app: ApplicationRecord): 'High' | 'Medium' | 'Normal' {
    if (app.priority) return app.priority;
    if (app.status === 'CORRECTION_REQUIRED' || app.riskLevel === 'HIGH') return 'High';
    if (app.riskLevel === 'MEDIUM') return 'Medium';
    return 'Normal';
  },

  getPriorityBadgeClass(priority: 'High' | 'Medium' | 'Normal'): string {
    switch (priority) {
      case 'High':
        return 'badge-danger';
      case 'Medium':
        return 'badge-warning';
      case 'Normal':
      default:
        return 'badge-info';
    }
  }
};
