import {
  ChatApiResponse,
  ChatApiError,
  HealthResponse,
  BedrockHealthResponse,
  MessageRole,
  Message,
  Conversation,
} from '../types/chat';
import { Memory } from '../types/memory';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

async function requestApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // Inject Bearer token from localStorage if present
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const errorData = data as ChatApiError;
    const error = new Error(errorData.error || `HTTP error ${response.status}`);
    (error as Error & { code?: string; status: number }).code = errorData.code;
    (error as Error & { code?: string; status: number }).status = response.status;
    throw error;
  }

  return data as T;
}

export const api = {
  /**
   * Health checks
   */
  async checkHealth(): Promise<HealthResponse> {
    return requestApi<HealthResponse>('/api/health');
  },

  async checkBedrockHealth(test = false): Promise<BedrockHealthResponse> {
    return requestApi<BedrockHealthResponse>(`/api/health/bedrock${test ? '?test=true' : ''}`);
  },

  /**
   * Chat API
   */
  async sendChatMessage(
    message: string,
    history?: Array<{ role: MessageRole; content: string }>,
    conversationId?: string
  ): Promise<ChatApiResponse> {
    return requestApi<ChatApiResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        messages: history && history.length > 0 ? history : undefined,
        conversationId,
      }),
    });
  },

  /**
   * Conversation Management APIs
   */
  async getConversations(): Promise<Conversation[]> {
    const data = await requestApi<{ conversations: Conversation[] }>('/api/conversations');
    return data.conversations || [];
  },

  async createConversation(title?: string, conversationId?: string): Promise<Conversation> {
    const data = await requestApi<{ conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, conversationId }),
    });
    return data.conversation;
  },

  async getConversation(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    return requestApi<{ conversation: Conversation; messages: Message[] }>(`/api/conversations/${conversationId}`);
  },

  async renameConversation(conversationId: string, title: string): Promise<Conversation> {
    const data = await requestApi<{ conversation: Conversation }>(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    return data.conversation;
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    const data = await requestApi<{ success: boolean }>(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    return data.success;
  },

  /**
   * Conversation History APIs (Amazon DynamoDB persistence)
   */
  async getChatHistory(conversationId?: string): Promise<Message[]> {
    const url = conversationId
      ? `/api/chat/history?conversationId=${encodeURIComponent(conversationId)}`
      : '/api/chat/history';
    const data = await requestApi<{ messages: Message[] }>(url);
    return data.messages || [];
  },

  async clearChatHistory(): Promise<number> {
    const data = await requestApi<{ success: boolean; count: number }>('/api/chat/history', {
      method: 'DELETE',
    });
    return data.count || 0;
  },

  /**
   * Memory APIs
   */
  async getMemories(): Promise<Memory[]> {
    const data = await requestApi<{ memories: Memory[] }>('/api/memories');
    return data.memories || [];
  },

  async createMemory(content: string, category?: string): Promise<Memory> {
    const data = await requestApi<{ memory: Memory }>('/api/memory', {
      method: 'POST',
      body: JSON.stringify({ content, category }),
    });
    return data.memory;
  },

  async updateMemory(recordId: string, content: string): Promise<Memory> {
    const data = await requestApi<{ memory: Memory }>(`/api/memories/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return data.memory;
  },

  async deleteMemory(recordId: string): Promise<boolean> {
    await requestApi(`/api/memories/${recordId}`, {
      method: 'DELETE',
    });
    return true;
  },

  async clearAllMemories(): Promise<number> {
    const data = await requestApi<{ count: number }>('/api/memories', {
      method: 'DELETE',
    });
    return data.count || 0;
  },
};
