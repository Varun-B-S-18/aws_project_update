import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types/chat';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ChatContextValue {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  serverStatus: 'checking' | 'connected' | 'disconnected';
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => Promise<void>;
  dismissError: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const isLoadedForUser = useRef<string | null>(null);

  const formatTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check health and load DynamoDB chat history on mount or when user changes
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Check health
      try {
        const res = await api.checkHealth();
        if (res.status === 'ok') {
          if (isMounted) setServerStatus('connected');
        } else {
          if (isMounted) setServerStatus('disconnected');
        }
      } catch {
        if (isMounted) setServerStatus('disconnected');
      }

      // 2. Load conversation history from DynamoDB if not already loaded for this user
      if (user?.userId && isLoadedForUser.current !== user.userId) {
        try {
          // Check local cache first for instant render
          const cacheKey = `chat_history_${user.userId}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached && isMounted) {
            try {
              setMessages(JSON.parse(cached));
            } catch {
              // ignore json parse error
            }
          }

          // Fetch authoritative chat history from DynamoDB
          const remoteHistory = await api.getChatHistory();
          if (isMounted && remoteHistory && remoteHistory.length > 0) {
            setMessages(remoteHistory);
            localStorage.setItem(cacheKey, JSON.stringify(remoteHistory));
          }
          isLoadedForUser.current = user.userId;
        } catch (historyErr) {
          console.warn('[ChatContext] Could not load DynamoDB chat history:', historyErr);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [user?.userId]);

  // Keep local cache in sync whenever messages change
  useEffect(() => {
    if (user?.userId) {
      localStorage.setItem(`chat_history_${user.userId}`, JSON.stringify(messages));
    }
  }, [messages, user?.userId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'user',
        content: trimmed,
        timestamp: formatTimestamp(),
      };

      const updatedHistory = [...messages, userMessage];
      setMessages(updatedHistory);
      setIsLoading(true);
      setError(null);

      const payloadMessages = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const data = await api.sendChatMessage(trimmed, payloadMessages);
        const assistantReplyText = data.reply || data.message || '';

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: assistantReplyText,
          timestamp: formatTimestamp(),
          memoriesUsed: data.memoriesUsed,
          memoryCount: data.memoryCount,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setServerStatus('connected');
      } catch (err: unknown) {
        console.error('Chat API invocation error:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Unable to reach the backend server. Please verify the backend is running.';
        setError(errorMsg);
        setServerStatus('connected');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const clearChat = useCallback(async () => {
    try {
      await api.clearChatHistory();
    } catch (clearErr) {
      console.warn('[ChatContext] Failed to clear history in DynamoDB:', clearErr);
    }
    setMessages([]);
    setError(null);
    if (user?.userId) {
      localStorage.removeItem(`chat_history_${user.userId}`);
    }
  }, [user?.userId]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        error,
        serverStatus,
        sendMessage,
        clearChat,
        dismissError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

