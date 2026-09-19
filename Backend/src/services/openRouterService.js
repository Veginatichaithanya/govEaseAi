import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || '';

// Mask key for safe server diagnostics without leaking secrets
function maskSecret(key) {
  if (!key) return '(not set)';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

// Server startup validation
export function validateEnvironment() {
  const isConfigured = Boolean(OPENROUTER_API_KEY && OPENROUTER_MODEL);
  console.log(`[OpenRouter Service] Initializing AI Service...`);
  console.log(`[OpenRouter Service] Base URL: ${OPENROUTER_BASE_URL}`);
  console.log(`[OpenRouter Service] Model: ${OPENROUTER_MODEL || '(MISSING - required)'}`);
  console.log(`[OpenRouter Service] API Key: ${maskSecret(OPENROUTER_API_KEY)}`);
  
  if (!OPENROUTER_API_KEY) {
    console.warn(`[OpenRouter Service] WARNING: OPENROUTER_API_KEY is not set. AI requests will return 503.`);
  }
  if (!OPENROUTER_MODEL) {
    console.warn(`[OpenRouter Service] WARNING: OPENROUTER_MODEL is not set. AI requests will return 500.`);
  }
  return isConfigured;
}

export function getAIStatus() {
  return {
    success: true,
    configured: Boolean(OPENROUTER_API_KEY && OPENROUTER_MODEL),
    provider: 'OpenRouter',
    model: OPENROUTER_MODEL || 'not-configured'
  };
}

const STATUS_EXPLANATIONS = {
  DRAFT: 'The application is still being prepared.',
  SUBMITTED: 'The application has been submitted and is waiting for processing.',
  AI_PROCESSING: 'The uploaded documents are being analyzed.',
  OFFICER_REVIEW: 'An authorized officer is reviewing the application.',
  CORRECTION_REQUIRED: 'The officer has requested changes or additional information.',
  RESUBMITTED: 'The corrected application has been submitted again.',
  APPROVED: 'The application has been approved by the authorized officer.',
  REJECTED: "The application was rejected. Check the officer's remarks for details.",
  DIGITAL_APPROVAL: 'The approved application has a digital approval record available.'
};

/**
 * Generate AI Guidance via OpenRouter API.
 * @param {Object} params
 * @param {string} params.message - The citizen's query
 * @param {string} [params.serviceId] - Identifier of the selected service
 * @param {Object} [params.serviceContext] - Structured metadata of the service
 * @param {Object} [params.applicationContext] - Active application state (id, service, status, remarks)
 * @param {Array} [params.conversationHistory] - Previous chat messages
 */
export async function generateGuidance({
  message,
  serviceId,
  serviceContext,
  applicationContext,
  conversationHistory = []
}) {
  // 1. Validation checks
  if (!OPENROUTER_API_KEY) {
    return {
      success: false,
      error: 'AI service is not configured.'
    };
  }

  if (!OPENROUTER_MODEL) {
    return {
      success: false,
      error: 'AI service configuration is invalid.'
    };
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      success: false,
      error: 'Query message is required.'
    };
  }

  // 2. Build controlled system prompt
  let contextBlock = '';
  if (serviceContext) {
    const docs = Array.isArray(serviceContext.requiredDocuments)
      ? serviceContext.requiredDocuments.map(d => `${d.name} (${d.required ? 'Required' : 'Optional'})`).join(', ')
      : 'Standard proofs';
    
    const steps = Array.isArray(serviceContext.applicationSteps)
      ? serviceContext.applicationSteps.join(' -> ')
      : 'Standard 9-step digital workflow';

    const elig = Array.isArray(serviceContext.eligibility)
      ? serviceContext.eligibility.join('; ')
      : 'Configured citizen criteria';

    contextBlock += `\nSELECTED SERVICE CONTEXT:
- Service Name: ${serviceContext.name || serviceId}
- Department: ${serviceContext.department || 'State Administration'}
- Category: ${serviceContext.category || 'Public Service'}
- Statutory Fee: ${serviceContext.fee || 'Configured nominal fee'}
- Processing Time: ${serviceContext.processingTime || 'Standard turnaround'}
- Required Proofs: ${docs}
- Eligibility Criteria: ${elig}
- Application Steps: ${steps}\n`;
  }

  if (applicationContext) {
    const rawStatus = applicationContext.status || '';
    const explanation = STATUS_EXPLANATIONS[rawStatus] || rawStatus;
    contextBlock += `\nCITIZEN'S ACTIVE APPLICATION CONTEXT:
- Application ID: ${applicationContext.id || 'N/A'}
- Service: ${applicationContext.service || serviceContext?.name || 'N/A'}
- Status: ${rawStatus} (${explanation})
${applicationContext.remarks ? `- Officer Remarks: "${applicationContext.remarks}"` : ''}\n`;
  }

  const systemPrompt = `You are GovEaseAI, an AI guidance assistant for a government service automation prototype.
Your role:
- Help citizens understand available government services (Trade License, Shop Registration, Business License, Building Permission, Factory Registration, Pollution Certificate).
- Explain configured service requirements, application steps, and required documents.
- Explain application statuses using official explanations (DRAFT: The application is still being prepared; SUBMITTED: The application has been submitted and is waiting for processing; AI_PROCESSING: The uploaded documents are being analyzed; OFFICER_REVIEW: An authorized officer is reviewing the application; CORRECTION_REQUIRED: The officer has requested changes or additional information; RESUBMITTED: The corrected application has been submitted again; APPROVED: The application has been approved by the authorized officer; REJECTED: The application was rejected; DIGITAL_APPROVAL: The approved application has a digital approval record available).
- Help citizens understand AI processing results and how to track applications.
- Always answer using the selected service context provided below.

Strict Guardrails:
- Do NOT claim to be a government officer.
- Do NOT approve or reject applications.
- Do NOT guarantee approval.
- Do NOT invent government requirements, statutory fees, or processing times.
- Do NOT provide unsupported legal advice.
- Do NOT claim that AI verification is legally authoritative.
- If information is not available in the provided service context: clearly state that the information is not available in the current prototype configuration and recommend checking the authorized department.
- Keep answers concise, clear, civil, and professional (2 to 4 sentences or brief bullet points).
${contextBlock}`;

  // 3. Assemble message payload with windowed history (last 6 messages max)
  const windowedHistory = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: String(m.text || '').slice(0, 1000)
      }))
    : [];

  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...windowedHistory,
    { role: 'user', content: message.trim().slice(0, 1000) }
  ];

  // 4. Execute fetch call to OpenRouter with 10s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://goveaseai.local',
        'X-Title': 'GovEaseAI Portal'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: openAiMessages,
        temperature: 0.2,
        max_tokens: 450
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.status === 429) {
      console.warn('[OpenRouter Service] Rate limit reached (429)');
      return {
        success: false,
        error: 'AI service is temporarily busy. Please try again later.'
      };
    }

    if (!response.ok) {
      console.warn(`[OpenRouter Service] Provider HTTP ${response.status}`);
      return {
        success: false,
        error: 'AI guidance is temporarily unavailable. Please try again.'
      };
    }

    const data = await response.json();
    const rawAnswer = data.choices?.[0]?.message?.content;

    if (!rawAnswer) {
      return {
        success: false,
        error: 'AI guidance is temporarily unavailable.'
      };
    }

    return {
      success: true,
      answer: rawAnswer.trim(),
      serviceId: serviceId || null
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[OpenRouter Service] Request timed out (10s)');
      return {
        success: false,
        error: 'AI guidance request timed out. Please try again.'
      };
    }

    console.warn('[OpenRouter Service] Network/Fetch error');
    return {
      success: false,
      error: 'AI guidance is temporarily unavailable. Please try again.'
    };
  }
}
