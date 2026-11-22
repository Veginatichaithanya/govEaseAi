import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import {
  type FileAttachment,
  type ConversationSummary,
  type ConversationMessageItem,
  validateFile,
  fileToAttachment,
  formatFileSize,
  MAX_ATTACHMENTS,
  ALLOWED_TYPES,
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  streamConversationChat,
} from '../services/aiMultimodalService';
import { mockAIService } from '../mock/aiService';
import { MOCK_SERVICES } from '../mock/services';
import {
  Send,
  Square,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  ChevronDown,
  Menu,
  ArrowDown,
  RotateCcw,
  BookOpen,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { ASSISTANT_SERVICES } from '../components/FloatingAIAssistant';

interface AttachedFile {
  file: File;
  preview?: string;
  attachment?: FileAttachment;
  error?: string;
  loading: boolean;
}

export const OFFICIAL_PORTALS: Record<string, string> = {
  'trade-license': 'https://services.india.gov.in',
  'shop-registration': 'https://eshram.gov.in',
  'business-license': 'https://www.nsws.gov.in',
  'building-permission': 'https://mohua.gov.in',
  'factory-registration': 'https://labour.gov.in',
  'pollution-certificate': 'https://cpcb.nic.in',
  'other': 'https://services.india.gov.in',
};

const SERVICE_PROMPTS: Record<string, string[]> = {
  'trade-license': [
    'What documents do I need?',
    'How do I apply?',
    'What information is required?',
    'What are the fees?',
    'Check my uploaded documents',
  ],
  'building-permission': [
    'What documents do I need?',
    'How do I apply?',
    'What architectural plans are required?',
    'What is the fee and validity?',
    'Check my uploaded documents',
  ],
  'shop-registration': [
    'What documents are required?',
    'Who can apply?',
    'What details are needed?',
    'How do I register?',
    'Check my uploaded documents',
  ],
  'factory-registration': [
    'What documents are required?',
    'What compliance is needed?',
    'How does the registration work?',
    'Check my uploaded documents',
  ],
  'pollution-certificate': [
    'What documents are required?',
    'Which consent applies (CTE or CTO)?',
    'What is the application process?',
    'Check my uploaded documents',
  ],
  'business-license': [
    'What documents do I need?',
    'How do I apply?',
    'What information is required?',
    'Check my uploaded documents',
  ],
  'other': [
    'How does GovEaseAI work?',
    'What government services can I apply for?',
    'How do I track my submitted application?',
    'How does AI document verification work?',
  ],
};

export const SERVICE_TOPICS: Record<string, string[]> = {
  'trade-license': [
    'Required documents & commercial proof',
    'Municipal Licensing Division workflow',
    'Statutory fees & validity period',
    'Document verification & checklist',
  ],
  'building-permission': [
    'Architectural drawings & structural plans',
    'Zonal master plan & land use clearance',
    'Fire safety NOC & environmental checks',
    'Town planning approval stages',
  ],
  'shop-registration': [
    'Form A establishment filing',
    'Operating hours & employee roll criteria',
    'Department of Labour regulations',
    'Fee schedules & renewal validity',
  ],
  'factory-registration': [
    'Factories Act 1948 blueprints & safety NOC',
    'Worker headcount & power thresholds',
    'Inspectorate of Factories site scrutiny',
    'Machinery clearance requirements',
  ],
  'pollution-certificate': [
    'Consent to Establish (CTE) & Operate (CTO)',
    'Red, Orange, Green & White industrial categories',
    'Effluent Treatment Plant (ETP/STP) reports',
    'Pollution Control Board statutory norms',
  ],
  'business-license': [
    'Directorate of Industries clearance',
    'MSME Udyam & entity registration',
    'Commercial license validity & renewals',
    'Statutory compliance checklist',
  ],
  'other': [
    'Citizen service catalog guidance',
    'Digital application workflows',
    'AI document verification explanation',
    'Application status tracking',
  ],
};

export const GeminiSparkleIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    <path
      d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
      fill="url(#geminiGradAssistant)"
    />
    <defs>
      <linearGradient id="geminiGradAssistant" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4" />
        <stop offset="0.32" stopColor="#9B72CB" />
        <stop offset="0.68" stopColor="#D96570" />
        <stop offset="1" stopColor="#1E88E5" />
      </linearGradient>
    </defs>
  </svg>
);

interface GeminiCardItem {
  title: string;
  subtitle: string;
  prompt: string;
  icon: 'docs' | 'workflow' | 'fee' | 'verify';
}

const GEMINI_SERVICE_CARDS: Record<string, GeminiCardItem[]> = {
  'trade-license': [
    {
      title: 'Required Documents',
      subtitle: 'Commercial proof & address records checklist',
      prompt: 'What documents are required to apply for a Trade License?',
      icon: 'docs',
    },
    {
      title: 'Municipal Workflow',
      subtitle: 'Inspection, scrutiny & approval stages',
      prompt: 'Can you explain the step-by-step Municipal Licensing Division workflow?',
      icon: 'workflow',
    },
    {
      title: 'Statutory Fees & Validity',
      subtitle: 'Category-wise fee scale & annual renewal norms',
      prompt: 'What are the statutory fees and validity period for a Trade License?',
      icon: 'fee',
    },
    {
      title: 'AI Document Checklist',
      subtitle: 'Pre-screen your ownership proof & tenancy deeds',
      prompt: 'Check my uploaded documents and tell me what else I need for a Trade License.',
      icon: 'verify',
    },
  ],
  'building-permission': [
    {
      title: 'Architectural Drawings',
      subtitle: 'Structural blueprints & site layout guidelines',
      prompt: 'What architectural drawings and structural plans are needed for Building Permission?',
      icon: 'docs',
    },
    {
      title: 'Zonal & Land Use',
      subtitle: 'Master plan clearance & setback requirements',
      prompt: 'What are the zonal master plan and land use clearance requirements?',
      icon: 'workflow',
    },
    {
      title: 'Statutory Fee Schedule',
      subtitle: 'Scrutiny fees, development charges & validity',
      prompt: 'What are the scrutiny fees, development charges, and permit validity?',
      icon: 'fee',
    },
    {
      title: 'Fire & Safety NOC',
      subtitle: 'Environmental clearances & town planning rules',
      prompt: 'What fire safety and environmental NOC documents are mandatory?',
      icon: 'verify',
    },
  ],
  'shop-registration': [
    {
      title: 'Form A Filing',
      subtitle: 'Establishment details & ownership documents',
      prompt: 'What documents and proofs are required for Shop & Establishment Form A filing?',
      icon: 'docs',
    },
    {
      title: 'Labour Regulations',
      subtitle: 'Operating hours, weekly offs & employee rules',
      prompt: 'What are the Department of Labour regulations on operating hours and staff records?',
      icon: 'workflow',
    },
    {
      title: 'Registration Fee & Term',
      subtitle: 'Worker slab calculation & validity renewals',
      prompt: 'What is the fee schedule and renewal validity for Shop Registration?',
      icon: 'fee',
    },
    {
      title: 'Document Pre-Verification',
      subtitle: 'Verify rental agreement, PAN & electricity bills',
      prompt: 'How do I ensure my Shop Registration documents pass AI verification without rejection?',
      icon: 'verify',
    },
  ],
  'factory-registration': [
    {
      title: 'Factories Act 1948',
      subtitle: 'Factory blueprints & worker safety clearances',
      prompt: 'What documents and safety clearances are required under the Factories Act 1948?',
      icon: 'docs',
    },
    {
      title: 'Site Scrutiny Process',
      subtitle: 'Chief Inspector of Factories audit & inspection',
      prompt: 'How does the Inspectorate of Factories site scrutiny and approval process work?',
      icon: 'workflow',
    },
    {
      title: 'Power & Worker Slabs',
      subtitle: 'Horsepower thresholds & statutory license fees',
      prompt: 'What are the license fee slabs based on electric horsepower and worker headcount?',
      icon: 'fee',
    },
    {
      title: 'Machinery & Pollution NOC',
      subtitle: 'Pollution Control Board & machinery approvals',
      prompt: 'What machinery layout drawings and pollution consent records do I need to attach?',
      icon: 'verify',
    },
  ],
  'pollution-certificate': [
    {
      title: 'CTE vs CTO Guidelines',
      subtitle: 'Consent to Establish and Consent to Operate',
      prompt: 'What is the difference between CTE and CTO, and which consent applies to my unit?',
      icon: 'workflow',
    },
    {
      title: 'Industrial Categories',
      subtitle: 'Red, Orange, Green & White industrial classifications',
      prompt: 'How are Red, Orange, Green, and White industrial categories classified under CPCB?',
      icon: 'docs',
    },
    {
      title: 'ETP & STP Requirements',
      subtitle: 'Effluent treatment plant reports & emission norms',
      prompt: 'What Effluent Treatment Plant (ETP/STP) reports and emission parameters are mandatory?',
      icon: 'verify',
    },
    {
      title: 'Consent Validity & Fees',
      subtitle: 'Capital investment slabs & renewal schedules',
      prompt: 'What are the statutory consent fees and validity periods for pollution certificates?',
      icon: 'fee',
    },
  ],
  'business-license': [
    {
      title: 'Directorate Clearances',
      subtitle: 'MSME Udyam, entity certificate & trade proofs',
      prompt: 'What clearances are needed from the Directorate of Industries for a Business License?',
      icon: 'docs',
    },
    {
      title: 'Single Window Clearance',
      subtitle: 'Inter-departmental approval workflow',
      prompt: 'How does the single-window digital clearance workflow work for business licenses?',
      icon: 'workflow',
    },
    {
      title: 'Statutory Fee Schedule',
      subtitle: 'Government charges & annual compliance terms',
      prompt: 'What is the statutory fee structure and renewal process for a commercial business license?',
      icon: 'fee',
    },
    {
      title: 'AI Document Pre-Check',
      subtitle: 'Validate GSTIN, PAN & partnership deed files',
      prompt: 'Check my business documentation and verify if any mandatory annexures are missing.',
      icon: 'verify',
    },
  ],
  'other': [
    {
      title: 'Citizen Portal Guide',
      subtitle: 'Learn about all automated government services',
      prompt: 'What government services can I apply for on GovEaseAI?',
      icon: 'docs',
    },
    {
      title: 'AI Verification System',
      subtitle: 'How multimodal document OCR and matching works',
      prompt: 'How does the GovEaseAI multimodal AI verify my uploaded documents?',
      icon: 'verify',
    },
    {
      title: 'Application Tracking',
      subtitle: 'Monitor officer reviews and digital approvals',
      prompt: 'How do I track my submitted application through the officer review stages?',
      icon: 'workflow',
    },
    {
      title: 'Digital Approval Certificate',
      subtitle: 'Download tamper-proof approval certificates',
      prompt: 'What happens after officer approval, and how do I download the digital approval certificate?',
      icon: 'fee',
    },
  ],
};

export const AIAssistantPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const { serviceId: urlServiceId, applicationId: urlAppId } = useParams();

  const citizenName = authUser?.fullName || authUser?.name || 'Citizen';

  // Active service selection
  const initialService =
    urlServiceId || searchParams.get('service') || searchParams.get('serviceId') || 'trade-license';
  const initialAppId = urlAppId || searchParams.get('applicationId') || searchParams.get('appId') || undefined;

  const [activeServiceId, setActiveServiceId] = useState<string>(initialService);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessageItem[]>([]);
  const [input, setInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [lastSentText, setLastSentText] = useState<string>('');

  // ChatGPT-style scrolling tracking
  const [isUserNearBottom, setIsUserNearBottom] = useState<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with URL params
  useEffect(() => {
    if (urlServiceId && urlServiceId !== activeServiceId) {
      setActiveServiceId(urlServiceId);
    }
  }, [urlServiceId]);

  // Load conversations for authenticated citizen
  const refreshConversations = useCallback(async () => {
    if (!authUser) return;
    try {
      const list = await listConversations(undefined, historySearch || undefined);
      setConversations(list);
      return list;
    } catch (err) {
      console.warn('Failed to load conversations:', err);
      return [];
    }
  }, [authUser, historySearch]);

  // Initial load of past conversations
  useEffect(() => {
    let isCancelled = false;
    if (authUser) {
      refreshConversations().then(list => {
        if (isCancelled || !list) return;
        if (!currentConvId && list.length > 0) {
          const match = list.find(c => c.service_id === activeServiceId) || list[0];
          if (match) {
            handleSelectConversation(match.id);
          }
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [authUser]);

  // ChatGPT-style scroll detection
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom <= 120;
    setIsUserNearBottom(nearBottom);
    if (nearBottom) {
      setShowScrollBottomBtn(false);
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      setIsUserNearBottom(true);
      setShowScrollBottomBtn(false);
    }
  }, []);

  // Auto-scroll when messages update (only if user is already near bottom)
  useEffect(() => {
    if (isUserNearBottom) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    } else {
      if (isStreaming || messages.length > 0) {
        setShowScrollBottomBtn(true);
      }
    }
  }, [messages, streamingContent, isStreaming, isUserNearBottom]);

  // Dynamic textarea sizing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 42), 140)}px`;
    }
  }, [input]);

  // Close history drawer or dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (window.innerWidth < 768) {
          setIsHistoryOpen(false);
        }
        setServiceDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeServiceObj = useMemo(() => {
    return ASSISTANT_SERVICES.find(s => s.id === activeServiceId) || ASSISTANT_SERVICES[0];
  }, [activeServiceId]);

  const quickQuestions = useMemo(() => {
    return SERVICE_PROMPTS[activeServiceId] || SERVICE_PROMPTS['trade-license'];
  }, [activeServiceId]);

  const activeGeminiCards = useMemo(() => {
    return GEMINI_SERVICE_CARDS[activeServiceId] || GEMINI_SERVICE_CARDS['trade-license'] || GEMINI_SERVICE_CARDS['other'];
  }, [activeServiceId]);

  const getServiceLabel = (serviceId?: string | null) => {
    if (!serviceId || serviceId === 'other' || serviceId === 'general') return 'General Assistant';
    const found = ASSISTANT_SERVICES.find(s => s.id === serviceId);
    return found ? found.name : serviceId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatItemTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group conversations chronologically
  const groupedConversations = useMemo(() => {
    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const thisWeek: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    conversations.forEach(c => {
      const cDate = new Date(c.updated_at || c.created_at);
      const diffDays = Math.floor((now.getTime() - cDate.getTime()) / oneDay);
      if (diffDays === 0) today.push(c);
      else if (diffDays === 1) yesterday.push(c);
      else if (diffDays <= 7) thisWeek.push(c);
      else older.push(c);
    });

    return { today, yesterday, thisWeek, older };
  }, [conversations]);

  // Start new chat under current service
  const handleStartNewChat = async (serviceIdToUse?: string) => {
    if (isCreatingChat) return;
    const sId = serviceIdToUse || activeServiceId;
    try {
      setIsCreatingChat(true);
      setErrorMessage(null);
      const newConv = await createConversation(sId, initialAppId, undefined);
      setCurrentConvId(newConv.id);
      setMessages([]);
      setStreamingContent('');
      setAttachedFiles([]);
      setInput('');
      setConversations(prev => {
        if (prev.some(c => c.id === newConv.id)) return prev;
        return [
          {
            id: newConv.id,
            title: newConv.title,
            service_id: newConv.service_id,
            application_id: newConv.application_id,
            mode: newConv.mode,
            created_at: newConv.created_at,
            updated_at: newConv.updated_at,
            message_count: 0,
          },
          ...prev,
        ];
      });
      if (window.innerWidth < 768) {
        setIsHistoryOpen(false);
      }
      textareaRef.current?.focus();
    } catch (err: any) {
      console.warn('Failed to start new chat:', err);
      setCurrentConvId(null);
      setMessages([]);
      textareaRef.current?.focus();
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    try {
      setErrorMessage(null);
      const detail = await getConversation(convId);
      setCurrentConvId(detail.id);
      if (detail.service_id) {
        setActiveServiceId(detail.service_id);
      } else {
        setActiveServiceId('other');
      }
      setMessages(detail.messages || []);
      setStreamingContent('');
      setAttachedFiles([]);
      if (window.innerWidth < 768) {
        setIsHistoryOpen(false);
      }
      setTimeout(() => scrollToBottom('auto'), 50);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open conversation.');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConvId === convId) {
        setCurrentConvId(null);
        setMessages([]);
        setStreamingContent('');
      }
    } catch (err) {
      console.warn('Delete failed:', err);
    }
  };

  const handleSelectService = (serviceId: string) => {
    setServiceDropdownOpen(false);
    if (serviceId === activeServiceId) return;
    setActiveServiceId(serviceId);
    const existing = conversations.find(c => (c.service_id || 'other') === serviceId);
    if (existing) {
      handleSelectConversation(existing.id);
    } else {
      setCurrentConvId(null);
      setMessages([]);
      setStreamingContent('');
      setAttachedFiles([]);
      setInput('');
    }
  };

  const addFiles = async (files: File[]) => {
    const remainingSlots = MAX_ATTACHMENTS - attachedFiles.length;
    if (remainingSlots <= 0) return;
    const toAdd = files.slice(0, remainingSlots);

    for (const file of toAdd) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setAttachedFiles(prev => [...prev, { file, loading: false, error: validation.error }]);
        continue;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setAttachedFiles(prev => [...prev, { file, preview, loading: true }]);

      try {
        const att = await fileToAttachment(file);
        setAttachedFiles(prev =>
          prev.map(a => (a.file === file ? { ...a, attachment: att, loading: false } : a))
        );
      } catch {
        setAttachedFiles(prev =>
          prev.map(a => (a.file === file ? { ...a, loading: false, error: 'Failed to read file.' } : a))
        );
      }
    }
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => {
      const copy = [...prev];
      if (copy[idx]?.preview) URL.revokeObjectURL(copy[idx].preview!);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : input).trim();
    const validAttachments = attachedFiles.filter(a => a.attachment && !a.error).map(a => a.attachment!);

    if ((!textToSend && validAttachments.length === 0) || isStreaming) return;

    setLastSentText(textToSend);

    let convId = currentConvId;
    if (!convId || convId.startsWith('local-')) {
      try {
        const newConv = await createConversation(activeServiceId, initialAppId, undefined);
        convId = newConv.id;
        setCurrentConvId(convId);
        setConversations(prev => [
          {
            id: newConv.id,
            title: newConv.title,
            service_id: newConv.service_id,
            application_id: newConv.application_id,
            mode: newConv.mode,
            created_at: newConv.created_at,
            updated_at: newConv.updated_at,
            message_count: 1,
          },
          ...prev.filter(c => c.id !== newConv.id),
        ]);
      } catch (err: any) {
        console.warn('Backend conversation init unavailable, continuing with local session:', err);
        convId = `local-${Date.now()}`;
        setCurrentConvId(convId);
      }
    }

    const userMessage: ConversationMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      attachments: validAttachments.map(a => ({
        filename: a.filename,
        mime_type: a.mime_type,
        size_bytes: a.size_bytes,
        data_base64: a.data_base64,
      })),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsStreaming(true);
    setStreamingContent('');
    setErrorMessage(null);
    setIsUserNearBottom(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedTokens = '';

    await streamConversationChat(
      convId,
      textToSend,
      validAttachments,
      (token: string) => {
        accumulatedTokens += token;
        setStreamingContent(accumulatedTokens);
      },
      async (data: any) => {
        let finalContent = (data.content || accumulatedTokens).trim();
        if (
          !finalContent ||
          finalContent.toLowerCase().includes('temporarily unavailable') ||
          finalContent.toLowerCase().includes('streaming unavailable') ||
          finalContent.toLowerCase().includes('error occurred while generating')
        ) {
          try {
            const currentSvc = MOCK_SERVICES.find(s => s.id === activeServiceId) || MOCK_SERVICES[0];
            const fallbackAns = await mockAIService.ask(currentSvc, textToSend);
            if (fallbackAns) {
              finalContent = fallbackAns;
            }
          } catch {
            // Keep finalContent
          }
        }

        const assistantMsg: ConversationMessageItem = {
          id: data.message_id || `asst-${Date.now()}`,
          role: 'assistant',
          content: finalContent,
          sources: data.sources || [],
          metadata: { service_id: activeServiceId },
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        abortControllerRef.current = null;
        refreshConversations();
      },
      async (err: string) => {
        if (err !== 'Generation stopped.') {
          try {
            const currentSvc = MOCK_SERVICES.find(s => s.id === activeServiceId) || MOCK_SERVICES[0];
            const fallbackAns = await mockAIService.ask(currentSvc, textToSend);
            if (fallbackAns) {
              const fallbackMsg: ConversationMessageItem = {
                id: `asst-${Date.now()}`,
                role: 'assistant',
                content: fallbackAns,
                sources: [],
                metadata: { service_id: activeServiceId },
                created_at: new Date().toISOString(),
              };
              setMessages(prev => [...prev, fallbackMsg]);
              setStreamingContent('');
              setIsStreaming(false);
              abortControllerRef.current = null;
              return;
            }
          } catch {
            // Ignore
          }
          setErrorMessage('Unable to generate a response. Please check connection or retry.');
        }
        if (accumulatedTokens) {
          const partialMsg: ConversationMessageItem = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: accumulatedTokens,
            metadata: { service_id: activeServiceId },
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, partialMsg]);
        }
        setStreamingContent('');
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      controller.signal
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const renderConversationItem = (c: ConversationSummary) => {
    const isSelected = c.id === currentConvId;
    return (
      <div
        key={c.id}
        onClick={() => handleSelectConversation(c.id)}
        className={`ai-history-item ${isSelected ? 'active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Open chat: ${c.title || 'Conversation'}`}
      >
        <div className="ai-history-item-content">
          <div className="ai-history-item-title">{c.title || 'New Conversation'}</div>
          <div className="ai-history-item-meta">
            <span className="ai-history-item-service">{getServiceLabel(c.service_id)}</span>
            <span className="ai-history-item-time">{formatItemTimestamp(c.updated_at || c.created_at)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={e => handleDeleteConversation(e, c.id)}
          className="ai-history-item-delete"
          aria-label="Delete conversation"
          title="Delete chat"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  };

  const renderHistoryContent = (isMobileView = false) => (
    <>
      <div className="ai-history-header">
        <div className="ai-history-header-top">
          <button
            type="button"
            onClick={() => handleStartNewChat()}
            className="gemini-new-chat-pill"
            title="Start new conversation"
            aria-label="New chat"
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>
          {isMobileView && (
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="ai-drawer-close-inline-btn"
              aria-label="Close history"
              title="Close drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="ai-history-search-box">
          <Search size={14} className="ai-history-search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={historySearch}
            onChange={e => setHistorySearch(e.target.value)}
            className="ai-history-search-input"
          />
          {historySearch && (
            <button
              type="button"
              onClick={() => setHistorySearch('')}
              className="ai-history-search-clear"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="ai-history-list">
        {conversations.length === 0 ? (
          <div className="ai-history-empty">
            <BookOpen size={22} className="ai-history-empty-icon" />
            <p>No past conversations</p>
            <span>Ask a question to begin</span>
          </div>
        ) : (
          <>
            {groupedConversations.today.length > 0 && (
              <div className="ai-history-group">
                <div className="ai-history-group-label">Today</div>
                <div>{groupedConversations.today.map(renderConversationItem)}</div>
              </div>
            )}

            {groupedConversations.yesterday.length > 0 && (
              <div className="ai-history-group">
                <div className="ai-history-group-label">Yesterday</div>
                <div>{groupedConversations.yesterday.map(renderConversationItem)}</div>
              </div>
            )}

            {groupedConversations.thisWeek.length > 0 && (
              <div className="ai-history-group">
                <div className="ai-history-group-label">This Week</div>
                <div>{groupedConversations.thisWeek.map(renderConversationItem)}</div>
              </div>
            )}

            {groupedConversations.older.length > 0 && (
              <div className="ai-history-group">
                <div className="ai-history-group-label">Older</div>
                <div>{groupedConversations.older.map(renderConversationItem)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <DashboardLayout hideHeader noPadding>
      <div className="ai-assistant-container">
        {/* ── Desktop Collapsible History Panel ── */}
        <div className={`ai-history-panel ${!isHistoryOpen ? 'collapsed' : ''}`}>
          {renderHistoryContent(false)}
        </div>

        {/* ── Mobile History Drawer Overlay ── */}
        {isHistoryOpen && (
          <div className="ai-mobile-drawer-wrapper">
            <div className="ai-mobile-backdrop" onClick={() => setIsHistoryOpen(false)} />
            <div className="ai-history-panel mobile-open">
              {renderHistoryContent(true)}
            </div>
          </div>
        )}

        {/* ── Main Chat Workspace ── */}
        <div className="ai-chat-workspace">
          {/* Header */}
          <header className="ai-workspace-header">
            <div className="ai-workspace-header-left">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(prev => !prev)}
                aria-label="Toggle conversation history"
                title="Conversation history"
                className={`ai-toggle-history-btn ${isHistoryOpen ? 'active' : ''}`}
              >
                <Menu size={18} />
              </button>

              <div className="ai-service-badge-icon" aria-hidden="true">
                {activeServiceObj.icon}
              </div>

              <div className="ai-service-header-titles">
                <h1>{activeServiceObj.name} Assistant</h1>
                <span>{activeServiceObj.department}</span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ThemeToggle />

              {/* Change Service Dropdown */}
              <div className="ai-service-selector-wrapper">
              <button
                type="button"
                id="assistant-service-selector"
                onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                className="ai-service-selector-btn"
                aria-expanded={serviceDropdownOpen}
                aria-haspopup="true"
              >
                <span className="desktop-service-label">Change Service</span>
                <span className="mobile-service-label">Service</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: serviceDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>

              {serviceDropdownOpen && (
                <div className="ai-service-dropdown-menu" role="menu">
                  <div className="ai-dropdown-header">Select Government Service</div>
                  {ASSISTANT_SERVICES.map(svc => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleSelectService(svc.id)}
                      className={`ai-service-dropdown-item ${activeServiceId === svc.id ? 'active' : ''}`}
                      role="menuitem"
                    >
                      <span className="ai-service-item-icon">{svc.icon}</span>
                      <div className="ai-service-item-text">
                        <span className="ai-service-item-name">{svc.name}</span>
                        <span className="ai-service-item-dept">{svc.department}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </header>

          {/* Scrollable Conversation Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="ai-messages-scroll-area"
          >
            <div className="ai-chat-column">
              {/* Empty Chat Welcome Hero (Gemini Style) */}
              {messages.length === 0 && (
                <div className="gemini-hero-container">
                  <h1 className="gemini-hero-greeting">
                    <span className="gemini-gradient-text">Hello, {citizenName}</span>
                    <span className="gemini-subheading">How can I help you with {activeServiceObj.name} today?</span>
                  </h1>
                  <p className="gemini-hero-desc">
                    Ask about eligibility criteria, required documents, fee schedules, or upload paperwork for instant AI pre-verification.
                  </p>

                  <div className="gemini-cards-grid">
                    {activeGeminiCards.map((card, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(card.prompt)}
                        className="gemini-card"
                        disabled={isStreaming}
                      >
                        <div className="gemini-card-top">
                          <span className="gemini-card-title">{card.title}</span>
                          <span className="gemini-card-desc">{card.subtitle}</span>
                        </div>
                        <div className="gemini-card-bottom">
                          <span className="gemini-card-icon-pill">
                            {card.icon === 'docs' && <FileText size={16} />}
                            {card.icon === 'workflow' && <Compass size={16} />}
                            {card.icon === 'fee' && <BookOpen size={16} />}
                            {card.icon === 'verify' && <ShieldCheck size={16} />}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`ai-msg-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                  {/* AI Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="gemini-msg-avatar" aria-hidden="true">
                      <GeminiSparkleIcon size={20} />
                    </div>
                  )}

                  <div className={`ai-msg-bubble-wrapper ${msg.role}`}>
                    {/* Assistant Header / Identity */}
                    {msg.role === 'assistant' && (
                      <div className="ai-msg-header-line">
                        <div className="ai-msg-header-identity">
                          <span className="ai-msg-author-name">GovEaseAI</span>
                          <span className="ai-msg-service-tag">{activeServiceObj.name}</span>
                        </div>
                        {msg.created_at && (
                          <span className="ai-msg-time-stamp">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    <div className={`ai-msg-bubble ${msg.role}`}>
                      {/* Attached Files inside user message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="ai-msg-attachments-container">
                          {msg.attachments.map((att, idx) => {
                            const isImage = att.mime_type?.startsWith('image/');
                            return (
                              <div key={idx} className="ai-msg-attachment-item">
                                {isImage && att.data_base64 ? (
                                  <div className="ai-msg-image-preview">
                                    <img
                                      src={`data:${att.mime_type};base64,${att.data_base64}`}
                                      alt={att.filename || 'Uploaded document'}
                                    />
                                    <span className="ai-msg-attachment-name">{att.filename}</span>
                                  </div>
                                ) : (
                                  <div className="ai-msg-doc-preview">
                                    <FileText size={16} className="ai-msg-doc-icon" />
                                    <div className="ai-msg-doc-info">
                                      <span className="ai-msg-doc-name">{att.filename}</span>
                                      <span className="ai-msg-doc-meta">
                                        {att.mime_type === 'application/pdf' ? 'PDF' : 'Document'}
                                        {att.size_bytes ? ` · ${formatFileSize(att.size_bytes)}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Content */}
                      {msg.role === 'assistant' ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="ai-user-text">{msg.content}</div>
                      )}

                      {/* Compact Statutory Sources Pills */}
                      {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                        <div className="ai-sources-container">
                          <span className="ai-sources-label">Sources:</span>
                          <div className="ai-sources-pills-row">
                            {msg.sources.map((src: any, sIdx: number) => (
                              <a
                                key={sIdx}
                                href={src.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ai-source-pill"
                                title={src.title || src.source_name}
                              >
                                <span>{src.title || src.source_name || 'Official Portal'}</span>
                                <ExternalLink size={10} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* User message timestamp */}
                      {msg.role === 'user' && msg.created_at && (
                        <div className="ai-msg-time-user">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming Assistant Row */}
              {isStreaming && (
                <div className="ai-msg-row assistant">
                  <div className="gemini-msg-avatar" aria-hidden="true">
                    <GeminiSparkleIcon size={20} />
                  </div>

                  <div className="ai-msg-bubble-wrapper assistant">
                    <div className="ai-msg-header-line">
                      <div className="ai-msg-header-identity">
                        <span className="ai-msg-author-name">GovEaseAI</span>
                        <span className="ai-msg-badge streaming">
                          <Loader2 size={11} className="animate-spin" />
                          <span>Generating</span>
                        </span>
                      </div>
                    </div>

                    <div className="ai-msg-bubble assistant streaming">
                      {streamingContent ? (
                        <>
                          <MarkdownRenderer content={streamingContent} />
                          <span className="ai-streaming-cursor" />
                        </>
                      ) : (
                        <div className="ai-streaming-placeholder">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Consulting {activeServiceObj.name} statutory knowledge...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="ai-error-banner">
                  <div className="ai-error-left">
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                  {lastSentText && (
                    <button
                      type="button"
                      onClick={() => handleSend(lastSentText)}
                      className="ai-error-retry-btn"
                    >
                      <RotateCcw size={12} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Floating Scroll-to-Bottom Button */}
          {showScrollBottomBtn && (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="ai-scroll-bottom-pill"
              aria-label="Scroll to latest response"
            >
              <ArrowDown size={14} />
              <span>New response</span>
            </button>
          )}

          {/* Bottom Docked Section */}
          <div className="ai-chat-footer">
            <div className="ai-chat-footer-inner">
              {/* Suggested Questions Pill Row */}
              <div className="ai-suggested-section">
                <div className="ai-suggested-scroll-track">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      disabled={isStreaming}
                      className="ai-suggested-chip"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini Floating Prompt Bar */}
              <div className="gemini-prompt-wrapper">
                {/* Attached files preview chips */}
                {attachedFiles.length > 0 && (
                  <div className="ai-composer-attachments-row">
                    {attachedFiles.map((att, idx) => (
                      <div key={idx} className="ai-composer-attachment-pill">
                        {att.file.type.startsWith('image/') ? (
                          <ImageIcon size={14} className="ai-composer-att-icon" />
                        ) : (
                          <FileText size={14} className="ai-composer-att-icon" />
                        )}
                        <span className="ai-composer-att-name">{att.file.name}</span>
                        <span className="ai-composer-att-size">({formatFileSize(att.file.size)})</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="ai-composer-att-remove"
                          aria-label={`Remove ${att.file.name}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="gemini-prompt-bar">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={e => {
                      if (e.target.files) addFiles(Array.from(e.target.files));
                    }}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="gemini-tool-btn"
                    title="Attach documents or images (PDF, JPG, PNG)"
                    aria-label="Attach file"
                  >
                    <Paperclip size={19} />
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Ask ${activeServiceObj.name} Assistant...`}
                    className="gemini-native-textarea"
                  />

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="gemini-action-btn stop"
                      title="Stop generation"
                      aria-label="Stop generation"
                    >
                      <Square size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!input.trim() && attachedFiles.length === 0}
                      className="gemini-action-btn send"
                      title="Send message (Enter)"
                      aria-label="Send message"
                    >
                      <Send size={15} />
                    </button>
                  )}
                </div>

                <div className="gemini-footer-disclaimer">
                  GovEaseAI can make mistakes. Verify official government requirements with authorized municipal authorities.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistantPage;
