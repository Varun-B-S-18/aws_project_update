import { ChatApiResponse, ChatApiError, HealthResponse, BedrockHealthResponse, MessageRole } from '../types/chat';
import { Memory } from '../types/memory';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

async function requestApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
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
    history?: Array<{ role: MessageRole; content: string }>
  ): Promise<ChatApiResponse> {
    return requestApi<ChatApiResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        messages: history && history.length > 0 ? history : undefined,
      }),
    });
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
