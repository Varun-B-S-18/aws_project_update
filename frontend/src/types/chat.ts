export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  memoriesUsed?: boolean;
  memoryCount?: number;
}

export interface Conversation {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatApiRequest {
  message?: string;
  messages?: Array<{
    role: MessageRole;
    content: string;
  }>;
  conversationId?: string;
}

export interface ChatApiResponse {
  reply?: string;
  message?: string;
  conversationId?: string;
  memoriesUsed?: boolean;
  memoryCount?: number;
}

export interface ChatApiError {
  error: string;
  code?: string;
}

export interface HealthResponse {
  status: 'ok';
}

export interface BedrockHealthResponse {
  status: 'configured' | 'connected' | 'error';
  region?: string;
  modelId?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
  code?: string;
  note?: string;
}
