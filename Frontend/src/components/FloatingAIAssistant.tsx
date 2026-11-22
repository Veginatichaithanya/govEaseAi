import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Send,
  Square,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Minimize2,
  Maximize2,
  Bot,
  Plus,
  History,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  Info,
  GripVertical,
  Sliders
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  type FileAttachment,
  type ConversationSummary,
  type ConversationMessageItem,
  type ServiceAIContext,
  validateFile,
  fileToAttachment,
  formatFileSize,
  MAX_ATTACHMENTS,
  ALLOWED_TYPES,
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  getServiceAIContext,
  streamConversationChat,
} from '../services/aiMultimodalService';
import { mockAIService } from '../mock/aiService';
import { MOCK_SERVICES } from '../mock/services';

import './FloatingAIAssistant.css';

export const ASSISTANT_SERVICES = [
  { id: 'trade-license', name: 'Trade License', icon: '🏢', department: 'Municipal Licensing Division' },
  { id: 'shop-registration', name: 'Shop Registration', icon: '🏬', department: 'Department of Labour' },
  { id: 'business-license', name: 'Business License', icon: '💼', department: 'Directorate of Industries' },
  { id: 'building-permission', name: 'Building Permission', icon: '🏗️', department: 'Urban Development & Town Planning' },
  { id: 'factory-registration', name: 'Factory Registration', icon: '🏭', department: 'Inspectorate of Factories' },
  { id: 'pollution-certificate', name: 'Pollution Certificate', icon: '🌿', department: 'Pollution Control Board' },
  { id: 'other', name: 'GovEaseAI', icon: '🤖', department: 'Government Service Guidance' },
];

const STORAGE_POS_KEY = 'goveaseai_chatbot_position';
const STORAGE_SIZE_KEY = 'goveaseai_chatbot_size';
const STORAGE_PILL_WIDTH_KEY = 'goveaseai_chatbot_pill_width';

interface WidgetSize {
  width: number;
  height: number;
}

const DEFAULT_SIZE: WidgetSize = {
  width: 460,
  height: 640
};

const SIZE_PRESETS = [
  { label: 'S', name: 'Compact', width: 380, height: 520 },
  { label: 'M', name: 'Standard', width: 460, height: 640 },
  { label: 'L', name: 'Wide', width: 680, height: 740 }
];

interface AttachedFile {
  file: File;
  preview?: string;
  attachment?: FileAttachment;
  error?: string;
  loading: boolean;
}

interface WidgetPosition {
  x: number;
  y: number;
}

export const FloatingAIAssistant: React.FC = () => {
  const { user: authUser } = useAuth();
  const location = useLocation();

  const citizenName = authUser?.fullName || authUser?.name || 'Citizen';

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [activeServiceId, setActiveServiceId] = useState<string>('trade-license');
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessageItem[]>([]);
  const [input, setInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [serviceContext, setServiceContext] = useState<ServiceAIContext | null>(null);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState<Record<string, boolean>>({});

  // Draggable position state
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Customizable Window Size state
  const [size, setSize] = useState<WidgetSize>(() => {
    if (typeof window === 'undefined') return DEFAULT_SIZE;
    try {
      const stored = localStorage.getItem(STORAGE_SIZE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return {
            width: Math.max(340, Math.min(Math.min(1150, window.innerWidth - 32), parsed.width)),
            height: Math.max(420, Math.min(Math.min(920, window.innerHeight - 32), parsed.height))
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read chatbot size:', e);
    }
    return DEFAULT_SIZE;
  });

  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [showSizeTooltip, setShowSizeTooltip] = useState<boolean>(false);

  // Customizable Collapsed Pill Size state
  const [pillWidth, setPillWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 300;
    try {
      const stored = localStorage.getItem(STORAGE_PILL_WIDTH_KEY);
      if (stored) {
        const num = Number(stored);
        if (!isNaN(num) && num >= 64 && num <= 420) {
          return num;
        }
      }
    } catch (err) {
      console.warn('Failed to read pill width:', err);
    }
    return 300;
  });

  const [isResizingPill, setIsResizingPill] = useState<boolean>(false);
  const [showPillSizeTooltip, setShowPillSizeTooltip] = useState<boolean>(false);
  const pillResizeRef = useRef<{
    startX: number;
    startW: number;
    startPosX?: number;
  } | null>(null);

  const startResizingPill = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    pillResizeRef.current = {
      startX: e.clientX,
      startW: pillWidth,
      startPosX: position?.x
    };

    setIsResizingPill(true);
    setShowPillSizeTooltip(true);

    const onPointerMove = (moveEv: PointerEvent) => {
      if (!pillResizeRef.current) return;
      const { startX, startW, startPosX } = pillResizeRef.current;
      const deltaX = moveEv.clientX - startX;

      // Dragging left (negative deltaX) increases width; dragging right decreases width
      const minW = 64;
      const maxW = Math.min(420, window.innerWidth - 32);
      const newW = Math.max(minW, Math.min(maxW, startW - deltaX));
      const roundedW = Math.round(newW);

      setPillWidth(roundedW);
      if (typeof startPosX === 'number') {
        const newX = startPosX + (startW - roundedW);
        setPosition(prev => prev ? { ...prev, x: Math.max(16, Math.min(newX, window.innerWidth - roundedW - 16)) } : null);
      }
    };

    const onPointerUp = () => {
      setIsResizingPill(false);
      setTimeout(() => setShowPillSizeTooltip(false), 1200);
      pillResizeRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      setPillWidth(latest => {
        try {
          localStorage.setItem(STORAGE_PILL_WIDTH_KEY, String(latest));
        } catch (err) {
          console.warn('Failed to save pill width:', err);
        }
        return latest;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const cyclePillPreset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const presets = [64, 210, 300, 360];
    const currentIdx = presets.findIndex(w => Math.abs(w - pillWidth) < 25);
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % presets.length;
    const nextW = presets[nextIdx];
    setPillWidth(nextW);
    try {
      localStorage.setItem(STORAGE_PILL_WIDTH_KEY, String(nextW));
    } catch (err) {
      console.warn('Failed to save pill width:', err);
    }
  };
  const resizeRef = useRef<{
    handle: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPosX?: number;
    startPosY?: number;
  } | null>(null);

  const startResizing = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExpanded) {
      setIsExpanded(false);
    }

    const currentW = size.width;
    const currentH = size.height;

    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW: currentW,
      startH: currentH,
      startPosX: position?.x,
      startPosY: position?.y
    };

    setIsResizing(true);
    setShowSizeTooltip(true);

    const onPointerMove = (moveEv: PointerEvent) => {
      if (!resizeRef.current) return;
      const { handle: hType, startX, startY, startW, startH, startPosX, startPosY } = resizeRef.current;

      const deltaX = moveEv.clientX - startX;
      const deltaY = moveEv.clientY - startY;

      const minW = 340;
      const maxW = Math.max(minW, Math.min(1150, window.innerWidth - 32));
      const minH = 420;
      const maxH = Math.max(minH, Math.min(920, window.innerHeight - 32));

      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      if (hType.includes('w')) {
        newW = Math.max(minW, Math.min(maxW, startW - deltaX));
        if (typeof newX === 'number') {
          newX = startPosX! + (startW - newW);
        }
      } else if (hType.includes('e')) {
        newW = Math.max(minW, Math.min(maxW, startW + deltaX));
      }

      if (hType.includes('n')) {
        newH = Math.max(minH, Math.min(maxH, startH - deltaY));
        if (typeof newY === 'number') {
          newY = startPosY! + (startH - newH);
        }
      } else if (hType.includes('s')) {
        newH = Math.max(minH, Math.min(maxH, startH + deltaY));
      }

      const roundedW = Math.round(newW);
      const roundedH = Math.round(newH);

      setSize({ width: roundedW, height: roundedH });
      if (typeof newX === 'number' && typeof newY === 'number') {
        setPosition({ x: Math.round(newX), y: Math.round(newY) });
      }
    };

    const onPointerUp = () => {
      setIsResizing(false);
      setTimeout(() => setShowSizeTooltip(false), 1200);
      resizeRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      setSize(latest => {
        try {
          localStorage.setItem(STORAGE_SIZE_KEY, JSON.stringify(latest));
        } catch (err) {
          console.warn('Failed to save size:', err);
        }
        return latest;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const applySizePreset = (presetW: number, presetH: number) => {
    setIsExpanded(false);
    const clampedW = Math.max(340, Math.min(Math.min(1150, window.innerWidth - 32), presetW));
    const clampedH = Math.max(420, Math.min(Math.min(920, window.innerHeight - 32), presetH));
    const newSize = { width: clampedW, height: clampedH };
    setSize(newSize);
    try {
      localStorage.setItem(STORAGE_SIZE_KEY, JSON.stringify(newSize));
    } catch (err) {
      console.warn('Failed to save preset size:', err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  // Exclude assistant on dedicated AI assistant workspace page
  const isAssistantRoute = location.pathname.toLowerCase().includes('/assistant');

  // Detect route-based service context on mount or route change
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    let detected = 'trade-license';
    if (path.includes('trade-license') || path.includes('trade')) detected = 'trade-license';
    else if (path.includes('shop-registration') || path.includes('shop')) detected = 'shop-registration';
    else if (path.includes('business-license') || path.includes('business')) detected = 'business-license';
    else if (path.includes('building-permission') || path.includes('building')) detected = 'building-permission';
    else if (path.includes('factory-registration') || path.includes('factory')) detected = 'factory-registration';
    else if (path.includes('pollution-certificate') || path.includes('pollution')) detected = 'pollution-certificate';
    else detected = 'other';

    setActiveServiceId(detected);
  }, [location.pathname]);

  // Load service context whenever active service changes
  useEffect(() => {
    let cancelled = false;
    getServiceAIContext(activeServiceId).then(ctx => {
      if (!cancelled) setServiceContext(ctx);
    });
    return () => {
      cancelled = true;
    };
  }, [activeServiceId]);

  // Initialize and clamp coordinates from localStorage or default to bottom-right
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const widgetW = 300;
    const widgetH = 68;

    const clampCoords = (x: number, y: number, w: number, h: number): WidgetPosition => {
      const maxX = Math.max(10, window.innerWidth - w - 16);
      const maxY = Math.max(10, window.innerHeight - h - 16);
      let safeX = Math.max(16, Math.min(x, maxX));
      let safeY = Math.max(16, Math.min(y, maxY));
      // If position falls into the top-left content/nav quadrant, relocate to safe bottom-right
      if (safeY < 240 && safeX < 520) {
        safeX = Math.max(16, window.innerWidth - w - 24);
        safeY = Math.max(16, window.innerHeight - h - 24);
      }
      return {
        x: safeX,
        y: safeY,
      };
    };

    try {
      const stored = localStorage.getItem(STORAGE_POS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(clampCoords(parsed.x, parsed.y, widgetW, widgetH));
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to parse stored position:', err);
    }

    // Default: bottom-right (bottom: 24px, right: 24px)
    const defaultX = Math.max(16, window.innerWidth - widgetW - 24);
    const defaultY = Math.max(16, window.innerHeight - widgetH - 24);
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  // Handle browser window resize to safely keep chatbot bounded within viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const currentW = isOpen ? 410 : 300;
        const currentH = isOpen ? 600 : 68;
        const maxX = Math.max(16, window.innerWidth - currentW - 16);
        const maxY = Math.max(16, window.innerHeight - currentH - 16);
        return {
          x: Math.max(16, Math.min(prev.x, maxX)),
          y: Math.max(16, Math.min(prev.y, maxY)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Refresh conversation list for citizen
  const refreshConversations = useCallback(async () => {
    if (!authUser) return;
    try {
      const list = await listConversations(undefined, historySearch || undefined);
      setConversations(list);
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  }, [authUser, historySearch]);

  useEffect(() => {
    if (isOpen && authUser) {
      refreshConversations();
    }
  }, [isOpen, authUser, refreshConversations]);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isOpen]);

  // Dynamic textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const activeServiceObj =
    ASSISTANT_SERVICES.find(s => s.id === activeServiceId) || ASSISTANT_SERVICES[0];

  // Drag handler for Pointer Events (desktop mouse + mobile touch)
  const startDragging = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left-click
    const target = e.target as HTMLElement;
    // Don't drag if user is clicking interactive controls (buttons, inputs, links)
    if (
      target.closest('button') &&
      !target.closest('.govease-pill-drag-handle') &&
      !target.closest('.govease-drag-grip-icon')
    ) {
      return;
    }
    if (target.closest('input') || target.closest('textarea') || target.closest('.govease-service-dropdown')) {
      return;
    }

    const currentW = isOpen ? 410 : 300;
    const currentH = isOpen ? 600 : 68;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = position?.x ?? Math.max(16, window.innerWidth - currentW - 24);
    const origY = position?.y ?? Math.max(16, window.innerHeight - currentH - 24);

    dragStartRef.current = {
      startX,
      startY,
      origX,
      origY,
      hasMoved: false,
    };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvt.clientX - dragStartRef.current.startX;
      const dy = moveEvt.clientY - dragStartRef.current.startY;

      if (!dragStartRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
        dragStartRef.current.hasMoved = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (dragStartRef.current.hasMoved) {
        const maxX = Math.max(0, window.innerWidth - currentW);
        const maxY = Math.max(0, window.innerHeight - currentH);
        const newX = Math.max(0, Math.min(maxX, dragStartRef.current.origX + dx));
        const newY = Math.max(0, Math.min(maxY, dragStartRef.current.origY + dy));
        setPosition({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (dragStartRef.current?.hasMoved) {
        setPosition(finalPos => {
          if (finalPos) {
            try {
              localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(finalPos));
            } catch (err) {
              console.warn('Failed to persist position:', err);
            }
          }
          return finalPos;
        });

        // Delay releasing drag lock so click handler does not trigger toggle
        setTimeout(() => {
          isDraggingRef.current = false;
          setIsDragging(false);
        }, 80);
      } else {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Toggle open / collapsed state with boundary adjustment
  const handleToggleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isDraggingRef.current) return;

    if (!isOpen) {
      // Opening chatbot: calculate position so expanded window fits on screen
      const expandedW = 410;
      const expandedH = 600;

      const currentX = position?.x ?? Math.max(16, window.innerWidth - 300 - 24);
      const currentY = position?.y ?? Math.max(16, window.innerHeight - 68 - 24);

      let adjustedY = currentY;
      if (adjustedY + expandedH > window.innerHeight - 16) {
        adjustedY = Math.max(16, window.innerHeight - expandedH - 16);
      }
      let adjustedX = currentX;
      if (adjustedX + expandedW > window.innerWidth - 16) {
        adjustedX = Math.max(16, window.innerWidth - expandedW - 16);
      }

      const updated = { x: adjustedX, y: adjustedY };
      setPosition(updated);
      try {
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(updated));
      } catch {}

      setIsOpen(true);
      if (!currentConvId) {
        handleStartNewChat(activeServiceId);
      }
    } else {
      setIsOpen(false);
    }
  };

  // Initialize a fresh conversation for the selected service
  const handleStartNewChat = async (serviceIdToUse?: string) => {
    const sId = serviceIdToUse || activeServiceId;
    try {
      setErrorMessage(null);
      const newConv = await createConversation(sId, undefined, undefined);
      setCurrentConvId(newConv.id);
      setMessages([]);
      setStreamingContent('');
      refreshConversations();
      setShowHistory(false);
    } catch (err: any) {
      console.error('Failed to create new conversation:', err);
      setCurrentConvId(`local-${Date.now()}`);
      setMessages([]);
    }
  };

  // Switch conversation from history
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
      setShowHistory(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open conversation.');
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      if (currentConvId === convId) {
        handleStartNewChat(activeServiceId);
      }
      refreshConversations();
    } catch (err) {
      console.warn('Delete failed:', err);
    }
  };

  // Handle service switch
  const handleSelectService = (serviceId: string) => {
    setServiceDropdownOpen(false);
    if (serviceId === activeServiceId && currentConvId) return;
    setActiveServiceId(serviceId);
    handleStartNewChat(serviceId);
  };

  // Attach files
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
          prev.map(a => (a.file === file ? { ...a, loading: false, error: 'Read error' } : a))
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

  // Send message
  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : input).trim();
    const validAttachments = attachedFiles.filter(a => a.attachment && !a.error).map(a => a.attachment!);

    if ((!textToSend && validAttachments.length === 0) || isStreaming) return;

    let convId = currentConvId;
    if (!convId || convId.startsWith('local-')) {
      try {
        const newConv = await createConversation(activeServiceId, undefined, undefined);
        convId = newConv.id;
        setCurrentConvId(convId);
      } catch (err) {
        console.warn('Fallback conv error:', err);
      }
    }

    const newUserMsg: ConversationMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend || 'Check attached document.',
      attachments: validAttachments.map(a => ({
        filename: a.filename,
        mime_type: a.mime_type,
        size_bytes: a.size_bytes,
      })),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setAttachedFiles([]);
    setErrorMessage(null);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedTokens = '';

    await streamConversationChat(
      convId || 'fallback',
      textToSend,
      validAttachments,
      (token: string) => {
        accumulatedTokens += token;
        setStreamingContent(accumulatedTokens);
      },
      async (sources: any[]) => {
        let finalContent = (accumulatedTokens || '').trim();
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

        const newAssistantMsg: ConversationMessageItem = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: finalContent || 'Guidance provided successfully.',
          metadata: { sources, service_id: activeServiceId },
        };
        setMessages(prev => [...prev, newAssistantMsg]);
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
                metadata: { service_id: activeServiceId },
              };
              setMessages(prev => [...prev, fallbackMsg]);
              setStreamingContent('');
              setIsStreaming(false);
              abortControllerRef.current = null;
              return;
            }
          } catch {
            // Ignore and display standard error below
          }
          setErrorMessage(err);
        }
        if (accumulatedTokens) {
          const partialMsg: ConversationMessageItem = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: accumulatedTokens,
            metadata: { service_id: activeServiceId },
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

  const toggleSources = (msgId: string) => {
    setSourcesOpen(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Group conversations for history drawer
  const groupConversations = () => {
    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const past7Days: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    conversations.forEach(c => {
      const cDate = new Date(c.updated_at || c.created_at);
      const diffDays = Math.floor((now.getTime() - cDate.getTime()) / oneDay);
      if (diffDays === 0) today.push(c);
      else if (diffDays === 1) yesterday.push(c);
      else if (diffDays <= 7) past7Days.push(c);
      else older.push(c);
    });

    return { today, yesterday, past7Days, older };
  };

  // Never render on dedicated assistant workspace page
  if (isAssistantRoute) {
    return null;
  }

  const grouped = groupConversations();

  // Determine widget style coordinates
  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    left: position ? `${position.x}px` : undefined,
    top: position ? `${position.y}px` : undefined,
    right: position ? undefined : '24px',
    bottom: position ? undefined : '24px',
    zIndex: 1000,
  };

  return (
    <div
      className={`govease-floating-widget-wrapper ${isDragging ? 'is-dragging' : ''}`}
      style={wrapperStyle}
    >
      {/* ── Collapsed State (Customizable Draggable Pill) ── */}
      {!isOpen && (
        <div
          id="govease-ai-launcher"
          className={`govease-floating-pill ${pillWidth <= 75 ? 'is-bubble' : pillWidth <= 220 ? 'is-compact' : ''} ${isResizingPill ? 'is-resizing' : ''}`}
          style={{ width: `${pillWidth}px` }}
          onPointerDown={startDragging}
          onClick={handleToggleOpen}
          role="button"
          tabIndex={0}
          aria-label="Open GovEaseAI Assistant"
          title={pillWidth <= 75 ? "GovEaseAI Assistant — Click to open, drag handle to resize" : "Drag to reposition, click to open"}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleOpen();
            }
          }}
        >
          {/* Pill Left Resize Handle */}
          <div
            className="govease-pill-resize-handle"
            onPointerDown={startResizingPill}
            title="Drag left/right to resize launcher pill"
            aria-label="Resize launcher pill"
          >
            <div className="govease-pill-resize-bar" />
          </div>

          {/* Drag Handle Indicator (hidden in icon bubble mode) */}
          {pillWidth > 75 && (
            <div
              className="govease-pill-drag-handle govease-drag-grip-icon"
              aria-label="Move GovEaseAI Assistant"
              title="Drag to move anywhere"
            >
              <GripVertical size={16} />
            </div>
          )}

          {/* Assistant Robot Avatar Badge */}
          <div className="govease-pill-badge">
            <Bot size={22} />
            <span className="govease-pill-status-dot" />
          </div>

          {/* Info Column (adaptive based on width) */}
          {pillWidth > 75 && (
            <div className="govease-pill-info">
              <span className="govease-pill-title">
                {activeServiceObj.id === 'other' ? 'GovEaseAI' : activeServiceObj.name} Assistant
              </span>
              {pillWidth > 220 && (
                <span className="govease-pill-subtitle">
                  Ask me anything
                </span>
              )}
            </div>
          )}

          {/* Quick Size Preset Cycle Button */}
          {pillWidth > 75 && (
            <button
              type="button"
              className="govease-pill-size-btn"
              onClick={cyclePillPreset}
              title={`Cycle launcher size (Current: ${pillWidth}px)`}
              aria-label="Cycle launcher size"
            >
              <Sliders size={13} />
            </button>
          )}

          {/* Expand Toggle Button */}
          {pillWidth > 75 && (
            <button
              type="button"
              className="govease-pill-toggle"
              aria-label="Expand GovEaseAI Assistant"
              onClick={handleToggleOpen}
            >
              <ChevronUp size={18} />
            </button>
          )}

          {/* Pill Size Tooltip Badge */}
          {showPillSizeTooltip && (
            <div className="govease-pill-size-tooltip">
              {pillWidth <= 75 ? 'Bubble (64px)' : `${pillWidth}px`}
            </div>
          )}
        </div>
      )}

      {/* ── Expanded State (ChatGPT-style Chat Window) ── */}
      {isOpen && (
        <div
          id="govease-ai-workspace"
          className={`govease-chat-window ${isExpanded ? 'is-fullscreen' : ''} ${isResizing ? 'is-resizing' : ''}`}
          style={!isExpanded ? { width: `${size.width}px`, height: `${size.height}px` } : undefined}
          role="region"
          aria-label="GovEaseAI Assistant Workspace"
        >
          {/* Resize Handles (Active when not fullscreen) */}
          {!isExpanded && (
            <>
              {/* Corner Handles */}
              <div
                className="govease-resize-handle govease-resize-nw"
                onPointerDown={(e) => startResizing(e, 'nw')}
                title="Drag corner to resize width and height"
              />
              <div
                className="govease-resize-handle govease-resize-ne"
                onPointerDown={(e) => startResizing(e, 'ne')}
                title="Drag corner to resize width and height"
              />
              <div
                className="govease-resize-handle govease-resize-sw"
                onPointerDown={(e) => startResizing(e, 'sw')}
                title="Drag corner to resize width and height"
              />
              <div
                className="govease-resize-handle govease-resize-se"
                onPointerDown={(e) => startResizing(e, 'se')}
                title="Drag corner to resize width and height"
              />

              {/* Edge Handles */}
              <div
                className="govease-resize-edge govease-resize-n"
                onPointerDown={(e) => startResizing(e, 'n')}
                title="Drag top edge to resize height"
              />
              <div
                className="govease-resize-edge govease-resize-w"
                onPointerDown={(e) => startResizing(e, 'w')}
                title="Drag left edge to resize width"
              />
            </>
          )}

          {/* Size Tooltip Badge */}
          {showSizeTooltip && !isExpanded && (
            <div className="govease-size-tooltip">
              {size.width} × {size.height} px
            </div>
          )}
          {/* Draggable Chat Header */}
          <header
            className="govease-chat-header"
            onPointerDown={startDragging}
            title="Drag header to move window"
          >
            <div className="govease-header-left">
              {/* Drag Handle */}
              <div
                className="govease-pill-drag-handle govease-drag-grip-icon"
                aria-label="Move GovEaseAI Assistant"
                title="Drag header to move"
                style={{ padding: '4px' }}
              >
                <GripVertical size={16} />
              </div>

              {/* History Toggle Button */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setShowHistory(!showHistory);
                }}
                className={`govease-btn-icon ${showHistory ? 'active' : ''}`}
                aria-label="Open conversation history"
                title="Conversation History"
              >
                <History size={16} />
              </button>

              {/* Service Context Switcher */}
              <div className="relative" style={{ position: 'relative' }}>
                <button
                  type="button"
                  id="assistant-service-selector"
                  onClick={e => {
                    e.stopPropagation();
                    setServiceDropdownOpen(!serviceDropdownOpen);
                  }}
                  className="govease-service-picker-trigger"
                >
                  <span style={{ fontSize: '1rem' }}>{activeServiceObj.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeServiceObj.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      {activeServiceObj.department.split(' ')[0]}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Dropdown Menu */}
                {serviceDropdownOpen && (
                  <div className="govease-service-dropdown">
                    <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Select Department Context
                    </div>
                    {ASSISTANT_SERVICES.map(svc => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectService(svc.id);
                        }}
                        className={`govease-service-item ${activeServiceId === svc.id ? 'selected' : ''}`}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{svc.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{svc.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{svc.department}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Window Controls */}
            <div className="govease-header-controls">
              {/* Size Customizer Quick Presets */}
              <div className="govease-size-presets-group" title="Quick size presets">
                {SIZE_PRESETS.map((p) => {
                  const isCurrent = !isExpanded && Math.abs(size.width - p.width) < 30;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applySizePreset(p.width, p.height);
                      }}
                      className={`govease-size-preset-btn ${isCurrent ? 'active' : ''}`}
                      title={`${p.name} preset (${p.width} × ${p.height}px)`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleStartNewChat(activeServiceId);
                }}
                className="govease-btn-icon"
                title="Start a new chat"
                aria-label="Start new chat"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="govease-btn-icon"
                title={isExpanded ? 'Restore window size' : 'Maximize window'}
                aria-label={isExpanded ? 'Restore window' : 'Maximize window'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="govease-btn-icon"
                title="Close Assistant"
                aria-label="Close GovEaseAI Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* ── Main Body: History Sidebar + Messages Area ── */}
          <div className="govease-chat-body">
            {/* Conversation History Drawer */}
            {showHistory && (
              <div className="govease-history-drawer">
                <div className="govease-history-header">
                  <span>Past Chats</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartNewChat(activeServiceId)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                    >
                      <Plus size={13} /> New Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                      title="Back to chat"
                      aria-label="Back to chat"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="govease-history-search">
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    aria-label="Search past conversations"
                  />
                </div>

                <div className="govease-history-list">
                  {conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      No past conversations found.
                    </div>
                  ) : (
                    <>
                      {grouped.today.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.5rem' }}>
                            Today
                          </div>
                          {grouped.today.map(c => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectConversation(c.id)}
                              className={`govease-history-item ${currentConvId === c.id ? 'active' : ''}`}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                              <button
                                type="button"
                                onClick={e => handleDeleteConversation(e, c.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                title="Delete chat"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {grouped.yesterday.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.5rem' }}>
                            Yesterday
                          </div>
                          {grouped.yesterday.map(c => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectConversation(c.id)}
                              className={`govease-history-item ${currentConvId === c.id ? 'active' : ''}`}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                              <button
                                type="button"
                                onClick={e => handleDeleteConversation(e, c.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                title="Delete chat"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {grouped.past7Days.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.5rem' }}>
                            Previous 7 Days
                          </div>
                          {grouped.past7Days.map(c => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectConversation(c.id)}
                              className={`govease-history-item ${currentConvId === c.id ? 'active' : ''}`}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                              <button
                                type="button"
                                onClick={e => handleDeleteConversation(e, c.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                title="Delete chat"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {grouped.older.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.5rem' }}>
                            Older
                          </div>
                          {grouped.older.map(c => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectConversation(c.id)}
                              className={`govease-history-item ${currentConvId === c.id ? 'active' : ''}`}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                              <button
                                type="button"
                                onClick={e => handleDeleteConversation(e, c.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                title="Delete chat"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Main Messages Container */}
            <div className="govease-messages-container">
              {/* Disclaimer Banner */}
              <div className="govease-disclaimer-banner">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} style={{ color: 'var(--accent-cyan)' }} />
                  AI-assisted guidance. Subject to officer review.
                </span>
                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Assisting Citizen Portal</span>
              </div>

              {/* Messages Scroll Area */}
              <div className="govease-messages-scroll">
                {/* Welcome Card if chat is fresh */}
                {messages.length === 0 && (
                  <div className="govease-chat-welcome">
                    <div className="govease-welcome-icon">
                      <span>{activeServiceObj.icon}</span>
                    </div>
                    <h3 className="govease-welcome-title">
                      {activeServiceObj.id === 'other' ? 'GovEaseAI' : activeServiceObj.name} Assistant
                    </h3>
                    <p className="govease-welcome-desc">
                      Hello <strong>{citizenName}</strong>! How can I assist you today with {activeServiceObj.name}?
                    </p>

                    {/* Quick suggestion chips */}
                    {serviceContext?.quick_actions && serviceContext.quick_actions.length > 0 && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <div className="govease-suggestions-title">
                          Suggested Questions
                        </div>
                        <div className="govease-suggestions-chips">
                          {serviceContext.quick_actions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSend(q)}
                              className="govease-chip-btn"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Render Messages */}
                {messages.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`govease-msg-row ${m.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    {m.role !== 'user' && (
                      <div className="govease-msg-avatar asst">
                        <Bot size={15} />
                      </div>
                    )}

                    <div className={`govease-msg-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
                      {/* Attached files preview in message */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.5rem' }}>
                          {m.attachments.map((att, aIdx) => (
                            <div
                              key={aIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(0,0,0,0.15)',
                                fontSize: '0.7rem'
                              }}
                            >
                              <FileText size={12} />
                              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.filename}
                              </span>
                              <span style={{ opacity: 0.75, fontSize: '0.62rem' }}>
                                ({formatFileSize(att.size_bytes)})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content Markdown */}
                      <MarkdownRenderer content={m.content} />

                      {/* Sources Accordion */}
                      {m.metadata?.sources && m.metadata.sources.length > 0 && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => toggleSources(m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-blue)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            <Info size={12} />
                            <span>{m.metadata.sources.length} Official Source{m.metadata.sources.length > 1 ? 's' : ''} Cited</span>
                            <ChevronDown
                              size={12}
                              style={{ transform: sourcesOpen[m.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                            />
                          </button>
                          {sourcesOpen[m.id] && (
                            <div style={{ marginTop: '0.35rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--accent-cyan)', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {m.metadata.sources.map((src, sIdx) => (
                                <div key={sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                  <span style={{ fontWeight: 500 }}>• {src.title}</span>
                                  {src.source_url && (
                                    <a
                                      href={src.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px' }}
                                    >
                                      Verify <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {m.role === 'user' && (
                      <div className="govease-msg-avatar usr">
                        {citizenName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Assistant Response */}
                {isStreaming && (
                  <div className="govease-msg-row assistant">
                    <div className="govease-msg-avatar asst">
                      <Bot size={15} />
                    </div>
                    <div className="govease-msg-bubble assistant">
                      {streamingContent ? (
                        <>
                          <MarkdownRenderer content={streamingContent} />
                          <span style={{ display: 'inline-block', width: '6px', height: '14px', background: 'var(--accent-blue)', marginLeft: '4px', verticalAlign: 'middle' }} />
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Consulting {activeServiceObj.name} requirements...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: '0.75rem' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => handleSend(messages[messages.length - 1]?.content)}
                      style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Composer & Attachment Preview ── */}
              <div className="govease-composer-wrapper">
                {/* Attached files preview chips */}
                {attachedFiles.length > 0 && (
                  <div className="govease-attachment-preview-bar">
                    {attachedFiles.map((att, idx) => (
                      <div key={idx} className="govease-att-chip">
                        {att.file.type.startsWith('image/') ? (
                          <ImageIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
                        ) : (
                          <FileText size={14} style={{ color: 'var(--accent-blue)' }} />
                        )}
                        <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.file.name}
                        </span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                          ({formatFileSize(att.file.size)})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px' }}
                          title="Remove file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Composer Bar */}
                <div className="govease-composer-box">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => addFiles(Array.from(e.target.files || []))}
                    multiple
                    accept={ALLOWED_TYPES.join(',')}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStreaming || attachedFiles.length >= MAX_ATTACHMENTS}
                    className="govease-composer-btn attach"
                    title="Attach document or image (PDF, PNG, JPG)"
                    aria-label="Attach document or image"
                  >
                    <Paperclip size={17} />
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
                    className="govease-composer-textarea"
                    aria-label="Ask GovEaseAI Assistant"
                  />

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="govease-composer-btn stop"
                      title="Stop generating"
                      aria-label="Stop generating response"
                    >
                      <Square size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!input.trim() && attachedFiles.length === 0}
                      className="govease-composer-btn send"
                      title="Send message"
                      aria-label="Send message"
                    >
                      <Send size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingAIAssistant;
