import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation } from '../types/chat';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ChatContextValue {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isConversationsLoading: boolean;
  error: string | null;
  serverStatus: 'checking' | 'connected' | 'disconnected';
  createNewChat: () => void;
  selectConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => Promise<void>;
  dismissError: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const isLoadedForUser = useRef<string | null>(null);

  const formatTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeConversation = conversations.find(
    (c) => c.conversationId === activeConversationId
  ) || null;

  // Check health and load conversations when user changes
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Health check
      try {
        const res = await api.checkHealth();
        if (res.status === 'ok' && isMounted) {
          setServerStatus('connected');
        } else if (isMounted) {
          setServerStatus('disconnected');
        }
      } catch {
        if (isMounted) setServerStatus('disconnected');
      }

      // 2. Load conversations for authenticated user
      if (user?.userId && isLoadedForUser.current !== user.userId) {
        try {
          setIsConversationsLoading(true);
          const list = await api.getConversations();
          if (isMounted) {
            setConversations(list);
            // Requirement 4: On login, open a fresh, empty conversation automatically
            // Load existing conversation history into sidebar, but start with empty chat
            setActiveConversationId(null);
            setMessages([]);
            isLoadedForUser.current = user.userId;
          }
        } catch (convErr) {
          console.warn('[ChatContext] Failed to load conversations:', convErr);
        } finally {
          if (isMounted) setIsConversationsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [user?.userId]);

  // Start fresh new chat
  const createNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Select an existing conversation from sidebar
  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (conversationId === activeConversationId) return;

      try {
        setIsLoading(true);
        setError(null);
        setActiveConversationId(conversationId);

        const data = await api.getConversation(conversationId);
        setMessages(data.messages || []);
      } catch (err: unknown) {
        console.error('[ChatContext] Failed to load conversation messages:', err);
        setError('Failed to load conversation messages.');
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId]
  );

  // Rename a conversation
  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;

      try {
        const updated = await api.renameConversation(conversationId, trimmed);
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === conversationId ? { ...c, title: updated.title } : c
          )
        );
      } catch (err: unknown) {
        console.error('[ChatContext] Failed to rename conversation:', err);
        setError('Failed to rename conversation.');
        throw err;
      }
    },
    []
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await api.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((c) => c.conversationId !== conversationId));

        if (activeConversationId === conversationId) {
          createNewChat();
        }
      } catch (err: unknown) {
        console.error('[ChatContext] Failed to delete conversation:', err);
        setError('Failed to delete conversation.');
        throw err;
      }
    },
    [activeConversationId, createNewChat]
  );

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      // Determine or initialize conversation ID
      const targetConvId = activeConversationId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const isNewConv = !activeConversationId;

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

      if (isNewConv) {
        setActiveConversationId(targetConvId);
      }

      const payloadMessages = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const data = await api.sendChatMessage(trimmed, payloadMessages, targetConvId);
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

        // Refresh or update conversation list in sidebar immediately
        const refreshedList = await api.getConversations();
        setConversations(refreshedList);
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
    [messages, isLoading, activeConversationId]
  );

  const clearChat = useCallback(async () => {
    if (activeConversationId) {
      await deleteConversation(activeConversationId);
    } else {
      setMessages([]);
      setError(null);
    }
  }, [activeConversationId, deleteConversation]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isLoading,
        isConversationsLoading,
        error,
        serverStatus,
        createNewChat,
        selectConversation,
        renameConversation,
        deleteConversation,
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
