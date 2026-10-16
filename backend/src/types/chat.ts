export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  message?: string;
  messages?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  message?: string;
  memoriesUsed?: boolean;
  memoryCount?: number;
}

export interface ErrorResponse {
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
