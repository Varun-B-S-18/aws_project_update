export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  memoriesUsed?: boolean;
  memoryCount?: number;
}

export interface ChatApiRequest {
  message?: string;
  messages?: Array<{
    role: MessageRole;
    content: string;
  }>;
}

export interface ChatApiResponse {
  reply?: string;
  message?: string;
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
