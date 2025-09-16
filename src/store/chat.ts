import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  systemPrompt: string;
}

export interface OllamaStats {
  responseTime: number;
  tokensGenerated: number;
  tokensPerSecond: number;
}

interface ChatState {
  // Current session
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  
  // UI state
  isLoading: boolean;
  sidebarOpen: boolean;
  
  // Settings
  ollamaUrl: string;
  availableModels: string[];
  currentModel: string;
  systemPrompt: string;
  
  // Stats
  lastStats: OllamaStats | null;
  
  // Actions
  createNewSession: () => void;
  setCurrentSession: (sessionId: string) => void;
  addMessage: (content: string, role: 'user' | 'assistant', isStreaming?: boolean) => string;
  updateMessage: (messageId: string, content: string, isStreaming?: boolean) => void;
  deleteSession: (sessionId: string) => void;
  clearSessions: () => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  
  // Settings actions
  setOllamaUrl: (url: string) => void;
  setCurrentModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setAvailableModels: (models: string[]) => void;
  setStats: (stats: OllamaStats) => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const createDefaultSession = (model: string, systemPrompt: string): ChatSession => ({
  id: generateId(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  model,
  systemPrompt,
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      isLoading: false,
      sidebarOpen: true,
      ollamaUrl: 'http://localhost:11434',
      availableModels: ['deepseek-r1:1.5b'],
      currentModel: 'deepseek-r1:1.5b',
      systemPrompt: 'You are an expert AI code assistant. Help users with programming questions, code review, debugging, and technical explanations. Provide clear, concise, and accurate responses.',
      lastStats: null,

      // Session management
      createNewSession: () => {
        const { currentModel, systemPrompt } = get();
        const newSession = createDefaultSession(currentModel, systemPrompt);
        set((state) => ({
          currentSession: newSession,
          sessions: [newSession, ...state.sessions],
        }));
      },

      setCurrentSession: (sessionId: string) => {
        const { sessions } = get();
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          set({ currentSession: session });
        }
      },

      addMessage: (content: string, role: 'user' | 'assistant', isStreaming = false): string => {
        const { currentSession } = get();
        if (!currentSession) return '';

        const newMessage: Message = {
          id: generateId(),
          content,
          role,
          timestamp: new Date(),
          isStreaming,
        };

        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, newMessage],
          updatedAt: new Date(),
          title: currentSession.messages.length === 0 ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : currentSession.title,
        };

        set((state) => ({
          currentSession: updatedSession,
          sessions: state.sessions.map((s) => (s.id === currentSession.id ? updatedSession : s)),
        }));

        return newMessage.id;
      },

      updateMessage: (messageId: string, content: string, isStreaming = false) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedSession = {
          ...currentSession,
          messages: currentSession.messages.map((m) =>
            m.id === messageId ? { ...m, content, isStreaming } : m
          ),
          updatedAt: new Date(),
        };

        set((state) => ({
          currentSession: updatedSession,
          sessions: state.sessions.map((s) => (s.id === currentSession.id ? updatedSession : s)),
        }));
      },

      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        }));
      },

      clearSessions: () => {
        set({ sessions: [], currentSession: null });
      },

      updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title } : s)),
          currentSession: state.currentSession?.id === sessionId 
            ? { ...state.currentSession, title } 
            : state.currentSession,
        }));
      },

      // UI actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Settings actions
      setOllamaUrl: (url: string) => set({ ollamaUrl: url }),
      setCurrentModel: (model: string) => set({ currentModel: model }),
      setSystemPrompt: (prompt: string) => set({ systemPrompt: prompt }),
      setAvailableModels: (models: string[]) => set({ availableModels: models }),
      setStats: (stats: OllamaStats) => set({ lastStats: stats }),
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession,
        ollamaUrl: state.ollamaUrl,
        availableModels: state.availableModels,
        currentModel: state.currentModel,
        systemPrompt: state.systemPrompt,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);