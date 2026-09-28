/**
 * GovEaseAI Multimodal AI Service
 * All AI calls go through our FastAPI backend — never directly to Gemini or OpenRouter.
 * API keys are 100% server-side only.
 */

import { getAuthToken } from './apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FileAttachment {
  filename: string;
  mime_type: string;
  data_base64: string;   // base64 WITHOUT data: URI prefix
  size_bytes: number;
}

export interface ExtractionResult {
  document_type?: string;
  extracted_fields: Record<string, string | null>;
  confidence: Record<string, number>;
  warnings: string[];
  missing_fields: string[];
  needs_human_review: boolean;
  extraction_notes?: string;
}

export interface ComparisonField {
  field: string;
  application_value?: string;
  document_value?: string;
  status: 'MATCH' | 'MISMATCH' | 'REVIEW_REQUIRED' | 'NOT_FOUND';
  confidence: number;
  explanation?: string;
}

export interface VerificationResult {
  document_type?: string;
  comparison_results: ComparisonField[];
  overall_status: 'MATCH' | 'REVIEW_REQUIRED' | 'MISMATCH';
  warnings: string[];
  needs_human_review: boolean;
  ai_disclaimer: string;
}

export interface OfficerSummary {
  completeness_score: number;
  document_count: { received: number; required: number };
  potential_issues: string[];
  verification_summary: string;
  needs_officer_attention: boolean;
  ai_disclaimer: string;
}

export interface MultimodalChatResponse {
  success: boolean;
  answer?: string;
  error?: string;
  analysis_id?: string;
}

export interface DocumentExtractionResponse {
  success: boolean;
  extraction?: ExtractionResult;
  raw_answer?: string;
  error?: string;
  analysis_id?: string;
}

export interface VerificationResponse {
  success: boolean;
  verification?: VerificationResult;
  error?: string;
  analysis_id?: string;
}

export interface ApplicationSummaryResponse {
  success: boolean;
  summary?: OfficerSummary;
  error?: string;
  analysis_id?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS = 3;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mime_type?: string;
}

export function validateFile(file: File): FileValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extMimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const mime = ALLOWED_TYPES.includes(file.type) ? file.type : extMimeMap[ext] ?? file.type;

  if (!ALLOWED_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.name}". Allowed: PDF, JPEG, PNG, WEBP.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the 10 MB size limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  }
  return { valid: true, mime_type: mime };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mime: string): 'pdf' | 'image' {
  return mime === 'application/pdf' ? 'pdf' : 'image';
}

// ── Base64 Encoding ───────────────────────────────────────────────────────────

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data: URI prefix, keep only the base64 content
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachment(file: File): Promise<FileAttachment> {
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const base64 = await fileToBase64(file);
  return {
    filename: file.name,
    mime_type: validation.mime_type!,
    data_base64: base64,
    size_bytes: file.size,
  };
}

// ── URL & API Helpers ─────────────────────────────────────────────────────────

let RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
if (RAW_API_BASE && !RAW_API_BASE.startsWith('/') && !RAW_API_BASE.startsWith('http://') && !RAW_API_BASE.startsWith('https://')) {
  RAW_API_BASE = `https://${RAW_API_BASE}`;
}
const API_BASE = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE}/api`;

export function resolveUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith('/api')) {
    return `${API_BASE}${cleanEndpoint.slice(4)}`;
  }
  return `${API_BASE}${cleanEndpoint}`;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function postJSON<T>(
  url: string,
  body: unknown,
  timeoutMs = 45000,
  externalSignal?: AbortSignal
): Promise<T> {
  const fullUrl = resolveUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      // Differentiate errors as per project requirements:
      if (res.status === 401) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      if (res.status === 403) {
        throw new Error('You are not authorized to use this assistant.');
      }
      if (res.status === 400) {
        throw new Error(data?.detail || data?.error || 'Please check your message or attachment.');
      }
      if (res.status === 413) {
        throw new Error('File is too large (maximum allowed size is 10 MB).');
      }
      if (res.status === 429) {
        throw new Error('AI service is temporarily busy. Please try again in a moment.');
      }
      if (res.status === 500) {
        throw new Error('GovEaseAI could not process the request. Please try again.');
      }
      if (res.status === 503) {
        throw new Error('AI service is temporarily unavailable. Please try again shortly.');
      }
      throw new Error(data?.detail || data?.error || `Request failed with status ${res.status}.`);
    }

    return data as T;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw new Error('Generation stopped.');
      }
      throw new Error('AI request timed out. Please try again.');
    }
    if (
      err instanceof TypeError &&
      (err.message.includes('fetch') ||
        err.message.includes('Network') ||
        err.message.includes('Failed') ||
        err.message.includes('network'))
    ) {
      throw new Error(
        'Unable to connect to GovEaseAI right now. Please check that the AI service is running and try again.'
      );
    }
    throw err;
  }
}

// ── AI Service Functions ──────────────────────────────────────────────────────

/**
 * Send a chat message with optional file attachments.
 * Attachments are base64-encoded and sent to the backend — never to Gemini/OpenRouter directly.
 */
export async function aiChat(
  message: string,
  attachments?: FileAttachment[],
  options?: {
    serviceId?: string;
    applicationId?: string;
    serviceContext?: unknown;
    applicationContext?: unknown;
    conversationHistory?: unknown[];
    signal?: AbortSignal;
  }
): Promise<MultimodalChatResponse> {
  try {
    return await postJSON<MultimodalChatResponse>(
      '/api/ai/chat',
      {
        message,
        attachments: attachments ?? null,
        serviceId: options?.serviceId,
        applicationId: options?.applicationId,
        serviceContext: options?.serviceContext,
        applicationContext: options?.applicationContext,
        conversationHistory: options?.conversationHistory,
      },
      45000,
      options?.signal
    );
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to connect to GovEaseAI right now. Please check that the AI service is running and try again.',
    };
  }
}

/**
 * Upload a file directly for extraction (wizard document upload flow).
 * Uses FormData to avoid base64 overhead for large files.
 */
export async function analyzeFile(
  file: File,
  question = 'Extract all relevant information from this document.',
  applicationId?: string
): Promise<DocumentExtractionResponse> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('question', question);
  if (applicationId) formData.append('application_id', applicationId);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(resolveUrl('/api/ai/analyze-file'), {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}` };
    }
    return data as DocumentExtractionResponse;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'AI analysis timed out. Please try again.' };
    }
    return { success: false, error: 'AI analysis failed. Please try again.' };
  }
}

/**
 * Analyze a document already stored in the backend.
 */
export async function analyzeStoredDocument(
  documentId: string,
  question = 'Extract all relevant information from this document.',
  applicationId?: string,
  extractFields?: string[]
): Promise<DocumentExtractionResponse> {
  try {
    return await postJSON<DocumentExtractionResponse>(
      `/api/ai/documents/${documentId}/analyze`,
      { question, application_id: applicationId, extract_fields: extractFields },
      45000
    );
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Document analysis failed.',
    };
  }
}

/**
 * Run AI verification for an application's documents vs form data.
 */
export async function verifyApplicationDocuments(
  applicationId: string
): Promise<VerificationResponse> {
  try {
    return await postJSON<VerificationResponse>(
      `/api/ai/applications/${applicationId}/verify`,
      {},
      60000
    );
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'AI verification failed.',
    };
  }
}

/**
 * Get AI review summary for officer portal.
 */
export async function getApplicationAISummary(
  applicationId: string
): Promise<ApplicationSummaryResponse> {
  try {
    return await postJSON<ApplicationSummaryResponse>(
      `/api/ai/applications/${applicationId}/summary`,
      { include_verification: true },
      45000
    );
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'AI summary generation failed.',
    };
  }
}

/**
 * Check AI provider status from the backend.
 */
export async function getAIStatus(): Promise<{
  configured: boolean;
  primary_provider: string;
  openrouter: { configured: boolean; model: string };
  gemini: { configured: boolean; model: string };
}> {
  try {
    const res = await fetch(resolveUrl('/api/ai/status'));
    return await res.json();
  } catch {
    return {
      configured: false,
      primary_provider: 'unknown',
      openrouter: { configured: false, model: '' },
      gemini: { configured: false, model: '' },
    };
  }
}

// ── Persistent Conversations & ChatGPT Streaming ─────────────────────────────

export interface ConversationSummary {
  id: string;
  title: string;
  service_id: string | null;
  application_id: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: { filename: string; mime_type: string; size_bytes: number; data_base64?: string }[];
  sources?: { title: string; source_name: string; source_url?: string }[];
  metadata?: {
    sources?: { title: string; source_name: string; source_url?: string }[];
    service_id?: string;
  };
  created_at?: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  service_id: string | null;
  application_id: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
  messages: ConversationMessageItem[];
}

export interface ServiceAIContext {
  service_id: string;
  service_name: string;
  department: string;
  description: string;
  fee?: string;
  processing_time?: string;
  document_requirements: {
    id: string;
    name: string;
    description: string;
    required: boolean;
    accepted_formats: string[];
  }[];
  application_steps: {
    step_number: number;
    title: string;
    description: string;
    route: string;
  }[];
  quick_actions: string[];
}

export async function listConversations(
  serviceId?: string,
  query?: string
): Promise<ConversationSummary[]> {
  try {
    const params = new URLSearchParams();
    if (serviceId) params.append('service_id', serviceId);
    if (query) params.append('q', query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(resolveUrl(`/api/ai/conversations${qs}`), {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Failed to list conversations:', err);
    return [];
  }
}

export async function createConversation(
  serviceId?: string,
  applicationId?: string,
  title?: string
): Promise<ConversationDetail> {
  const body = {
    service_id: serviceId || null,
    application_id: applicationId || null,
    title: title || undefined,
  };
  return await postJSON<ConversationDetail>('/api/ai/conversations', body);
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = await fetch(resolveUrl(`/api/ai/conversations/${id}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load conversation (${res.status})`);
  return await res.json();
}

export async function deleteConversation(id: string): Promise<boolean> {
  const res = await fetch(resolveUrl(`/api/ai/conversations/${id}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
}

export async function renameConversation(id: string, title: string): Promise<boolean> {
  const res = await fetch(resolveUrl(`/api/ai/conversations/${id}`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  return res.ok;
}

export async function getServiceAIContext(serviceId: string): Promise<ServiceAIContext> {
  const res = await fetch(resolveUrl(`/api/services/${serviceId}/ai-context`));
  if (!res.ok) {
    return {
      service_id: serviceId,
      service_name: serviceId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      department: 'Government Department',
      description: 'AI-assisted guidance.',
      document_requirements: [],
      application_steps: [],
      quick_actions: [
        'What documents do I need?',
        'How do I apply for this service?',
        'What is the processing time?',
        'Check my documents',
      ],
    };
  }
  return await res.json();
}

export async function streamConversationChat(
  conversationId: string,
  message: string,
  attachments: FileAttachment[] = [],
  onToken: (token: string) => void,
  onDone: (sources: any[]) => void,
  onError: (err: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const url = resolveUrl(`/api/ai/conversations/${conversationId}/stream`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message, attachments }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Session expired. Please sign in again.');
      if (response.status === 403) throw new Error('Access denied to this conversation.');
      throw new Error(`AI assistant error (status ${response.status})`);
    }

    if (!response.body) throw new Error('No streaming body returned.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.token) onToken(data.token);
            if (data.done) onDone(data.sources || []);
            if (data.error) onError(data.error);
          } catch {
            // ignore non-json
          }
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted) {
      onError('Generation stopped.');
      return;
    }
    onError(err?.message || 'Error streaming response.');
  }
}

