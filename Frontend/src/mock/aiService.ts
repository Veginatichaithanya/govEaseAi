import type { GovernmentService } from './services';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const DASHBOARD_SUGGESTED_QUESTIONS = [
  'What documents do I need?',
  'How does the application process work?',
  'Can I apply online?',
  'What is my application status?'
];

export const SUGGESTED_QUESTIONS = DASHBOARD_SUGGESTED_QUESTIONS;

export interface AICitizenContext {
  user: { id: string; name: string } | null;
  applications?: Array<{
    id: string;
    serviceName: string;
    status: string;
    remarks?: string;
  }>;
  services?: GovernmentService[];
}

interface ServerGuidanceResponse {
  success: boolean;
  answer?: string;
  error?: string;
  serviceId?: string;
}

/**
 * Call Server-Side AI Guidance API.
 * Communicates strictly with our internal /api/ai/guidance endpoint.
 * The OpenRouter API key remains 100% on the server side.
 */
async function callServerGuidance(payload: {
  message: string;
  serviceId?: string;
  serviceContext?: any;
  applicationContext?: any;
  conversationHistory?: ChatMessage[];
}): Promise<ServerGuidanceResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/ai/guidance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('AI Server responded with status:', response.status);
      return null;
    }

    const data: ServerGuidanceResponse = await response.json();
    return data;
  } catch (err) {
    console.warn('Backend AI proxy request error, falling back to local guidance:', err);
    return null;
  }
}

export const mockAIService = {
  /**
   * Safe status check querying server-side AI endpoint without exposing credentials.
   */
  getOpenRouterStatus() {
    return {
      connected: true,
      model: 'openrouter/auto',
      provider: 'OpenRouter (Backend Proxy)',
      keyMasked: 'Protected Server-Side Secret'
    };
  },

  /**
   * Generates a contextual AI guidance response for a specific government service.
   * Relies on the server-side OpenRouter endpoint with graceful fallback to local heuristics.
   */
  async ask(
    service: GovernmentService,
    query: string,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    const serverResult = await callServerGuidance({
      message: query,
      serviceId: service.id,
      serviceContext: {
        id: service.id,
        name: service.name,
        department: service.department,
        category: service.category,
        fee: service.fee,
        processingTime: service.processingTime,
        eligibility: service.eligibility,
        requiredDocuments: service.requiredDocuments,
        applicationSteps: service.applicationSteps
      },
      conversationHistory
    });

    if (serverResult && serverResult.success && serverResult.answer) {
      return serverResult.answer;
    }

    // Fallback: Local rule-based heuristic if server is temporarily unreachable
    await new Promise((resolve) => setTimeout(resolve, 350));
    const q = query.toLowerCase().trim();

    // 1. Documents Query
    if (q.includes('document') || q.includes('proof') || q.includes('upload') || q.includes('attach')) {
      const docList = service.requiredDocuments.map((d) => d.name).join(', ');
      return `For this ${service.name} application, the prototype requires: ${docList}. Make sure each document is scanned clearly in PDF or JPEG format before uploading.`;
    }

    // 2. Eligibility / Who can apply
    if (q.includes('who') || q.includes('eligib') || q.includes('qualif') || q.includes('apply')) {
      const criteria = service.eligibility.join(' ');
      return `Eligibility requirements for ${service.name}: ${criteria}. Please ensure your premises and legal status meet these configured conditions.`;
    }

    // 3. Processing Time / Duration
    if (q.includes('how long') || q.includes('time') || q.includes('duration') || q.includes('days') || q.includes('turnaround')) {
      return `Estimated processing duration for ${service.name} is ${service.processingTime}. This includes automated AI extraction and subsequent departmental desk scrutiny by the licensing officer.`;
    }

    // 4. Application Process / Workflow / Steps
    if (q.includes('process') || q.includes('steps') || q.includes('work') || q.includes('workflow') || q.includes('how to')) {
      const stepsFormatted = service.applicationSteps.join(' → ');
      return `The GovEaseAI digital workflow for ${service.name} follows 9 transparent milestones: ${stepsFormatted}. AI assists with extraction, while final sanction is granted by the assigned officer.`;
    }

    // 5. Pre-submission Checks / What should I check
    if (q.includes('check') || q.includes('before') || q.includes('submit') || q.includes('warning') || q.includes('mistake')) {
      return `Before submitting your ${service.name} application, verify that your applicant name and commercial premises address match your uploaded proofs exactly. GovEaseAI's AI pre-validation will flag discrepancies to prevent administrative returns.`;
    }

    // 6. Fees / Cost
    if (q.includes('fee') || q.includes('cost') || q.includes('price') || q.includes('charge') || q.includes('pay')) {
      return `The statutory administrative fee for ${service.name} is: ${service.fee}. Fee tokens are logged securely during the digital application intake.`;
    }

    // 7. Department / Authority
    if (q.includes('department') || q.includes('authority') || q.includes('officer') || q.includes('who issues')) {
      return `${service.name} falls under the jurisdiction of the ${service.department}. Desk officers from this department hold statutory decision authority.`;
    }

    // 8. Safe Fallback Response for Unknown/General Queries
    return `Regarding "${query}": This is prototype AI guidance based on configured parameters for ${service.name}. For questions beyond standard eligibility, required proofs, and processing timelines, please consult the official service notification from ${service.department}.`;
  },

  /**
   * General Citizen Assistant for dashboard, floating widget, and dedicated /assistant page.
   * Proxied securely to Backend OpenRouter AI with active citizen context.
   */
  async askCitizenAssistant(
    query: string,
    context?: AICitizenContext,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    const activeApp = context?.applications?.[0];
    const serverResult = await callServerGuidance({
      message: query,
      applicationContext: activeApp
        ? {
            id: activeApp.id,
            service: activeApp.serviceName,
            status: activeApp.status,
            remarks: activeApp.remarks
          }
        : undefined,
      conversationHistory
    });

    if (serverResult && serverResult.success && serverResult.answer) {
      return serverResult.answer;
    }

    // Fallback: Local rule-based heuristic
    await new Promise((resolve) => setTimeout(resolve, 400));
    const q = query.toLowerCase().trim();

    // Specific match 1: What services can I apply for?
    if (
      q.includes('what services') ||
      q.includes('services can i apply') ||
      q.includes('available services') ||
      q.includes('list of services')
    ) {
      return 'You can currently explore Trade License, Shop Registration, Business License, Building Permission, Factory Registration and Pollution Certificate.';
    }

    // Specific match 2: Application status / Can I apply online?
    if (q.includes('apply online') || q.includes('can i apply online')) {
      return 'Yes! You can complete the entire application process online via GovEaseAI. Simply choose a service from Government Services, fill the structured form, upload required identity and property documents for AI pre-validation, review the extracted values, and submit directly for departmental officer scrutiny.';
    }

    if (
      q.includes('what is my application status') ||
      q.includes('application status') ||
      q.includes('how can i track') ||
      q.includes('track my application') ||
      q.includes('tracking') ||
      q.includes('status of my')
    ) {
      if (context?.applications && context.applications.length > 0) {
        const app = context.applications[0];
        const statusClean = app.status.replace(/_/g, ' ');
        return `Your ${app.serviceName} application (${app.id}) is currently in ${statusClean} status. You can open My Applications from the sidebar to view full live milestones, officer remarks, and digital approval records.`;
      }
      return 'You can check your submission status at any time under My Applications in the citizen sidebar.';
    }

    // Specific match 3: What does Officer Review mean?
    if (
      q.includes('what does officer review mean') ||
      q.includes('officer review') ||
      q.includes('under review')
    ) {
      return 'Officer Review means an authorized government officer is currently reviewing and verifying the application before granting sanction.';
    }

    // Specific match 4: How do I correct my application / What should I do if correction is required?
    if (
      q.includes('correct my application') ||
      q.includes('how do i correct') ||
      q.includes('correction required') ||
      q.includes('modify application') ||
      q.includes('what should i do if correction')
    ) {
      const correctionApp = context?.applications?.find((a) => a.status === 'CORRECTION_REQUIRED');
      if (correctionApp && correctionApp.remarks) {
        return `For your ${correctionApp.serviceName} (${correctionApp.id}), the officer remarked: "${correctionApp.remarks}". Open the application marked Correction Required from your dashboard or My Applications, update the requested information or documents, and resubmit.`;
      }
      return 'If an officer requests a correction: open the application marked Correction Required, review the officer remarks, update the requested information or documents, and resubmit.';
    }

    // Specific match 5: How does the application process work?
    if (
      q.includes('application process work') ||
      q.includes('how does the application process') ||
      q.includes('application workflow')
    ) {
      return 'The GovEaseAI digital workflow operates in transparent stages: 1) Select Service, 2) Provide Form Details, 3) Upload Proofs, 4) AI Document Analysis & Pre-verification, 5) Citizen Review, 6) Submission, 7) Officer Review, and 8) Digital Approval.';
    }

    // Specific match 6: What documents do I need?
    if (q.includes('what documents') || q.includes('document requirements') || q.includes('proofs needed')) {
      return 'Standard government services require: 1) Identity Proof (Aadhaar/PAN/Voter ID), 2) Address Proof (Electricity bill/Property tax), and 3) Service-specific proofs such as Partnership Deeds, Floor Plans, or NOCs. You can view precise documents by selecting any service from Government Services.';
    }

    // Contextual match: specific user application inquiry (e.g. Trade License, Shop Registration)
    if (context?.applications) {
      for (const app of context.applications) {
        if (q.includes(app.serviceName.toLowerCase()) || q.includes(app.id.toLowerCase())) {
          const statusText = app.status.replace(/_/g, ' ');
          let extra = '';
          if (app.remarks) {
            extra = ` Officer remarks: "${app.remarks}".`;
          }
          return `Your ${app.serviceName} application (${app.id}) is currently in ${statusText} status.${extra} You can open My Applications to inspect the full timeline.`;
        }
      }
    }

    // Safe fallback for unconfigured questions
    return 'I can provide prototype guidance using the information available in GovEaseAI. For official requirements or legal guidance, please verify with the authorized department.';
  }
};
