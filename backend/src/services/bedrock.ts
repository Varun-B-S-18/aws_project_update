import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message as BedrockMessage,
} from '@aws-sdk/client-bedrock-runtime';
import { ChatMessage } from '../types/chat';

export class BedrockService {
  private client: BedrockRuntimeClient | null = null;
  private customModelId?: string;
  private customRegion?: string;

  constructor(client?: BedrockRuntimeClient, modelId?: string, region?: string) {
    if (client) {
      this.client = client;
    }
    this.customModelId = modelId;
    this.customRegion = region;
  }

  /**
   * Resolves and validates AWS Region from custom override or environment.
   * Throws an explicit error if missing.
   */
  public getRegion(): string {
    const region = this.customRegion || process.env.AWS_REGION;
    if (!region) {
      throw new Error(
        'Missing required AWS Region configuration. Please set the AWS_REGION environment variable.'
      );
    }
    return region;
  }

  /**
   * Resolves and validates Bedrock Model ID from custom override or environment.
   * Throws an explicit error if missing.
   */
  public getModelId(): string {
    const modelId = this.customModelId || process.env.BEDROCK_MODEL_ID;
    if (!modelId) {
      throw new Error(
        'Missing required Bedrock Model ID configuration. Please set the BEDROCK_MODEL_ID environment variable.'
      );
    }
    return modelId;
  }

  /**
   * Returns a reused BedrockRuntimeClient instance configured for the active region.
   * Avoids re-instantiating the SDK client on every request.
   */
  public getClient(): BedrockRuntimeClient {
    if (!this.client) {
      const region = this.getRegion();
      this.client = new BedrockRuntimeClient({ region });
    }
    return this.client;
  }

  /**
   * Invokes Amazon Bedrock Converse API with user prompt string or conversation history.
   * Uses ConverseCommand and validates output.
   */
  public async generateReply(input: string | ChatMessage[]): Promise<string> {
    const messages: ChatMessage[] = typeof input === 'string'
      ? [{ role: 'user', content: input }]
      : input;

    if (!messages || messages.length === 0) {
      throw new Error('Message input cannot be empty');
    }

    const modelId = this.getModelId();
    const region = this.getRegion();
    const client = this.getClient();

    // Convert messages to Bedrock Converse format
    const bedrockMessages: BedrockMessage[] = messages.map((m) => ({
      role: m.role,
      content: [{ text: m.content }],
    }));

    // Log diagnostic metadata without logging full message contents or sensitive data
    console.log(`[BedrockService] Invoking model: ${modelId} (Region: ${region}, MessageCount: ${messages.length})`);

    try {
      const maxTokens = parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10);
      const command = new ConverseCommand({
        modelId,
        messages: bedrockMessages,
        inferenceConfig: {
          maxTokens: isNaN(maxTokens) ? 2048 : maxTokens,
          temperature: 0.7,
        },
      });

      const response = await client.send(command);
      const responseText = response.output?.message?.content?.[0]?.text;

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Bedrock returned an empty response content');
      }

      console.log(`[BedrockService] Model invocation succeeded (ResponseLength: ${responseText.length} chars)`);
      return responseText;
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      // Log diagnostic details without leaking credentials or message text
      console.error('[BedrockService] Model invocation failed:', {
        name: err.name,
        code: err.code,
        message: err.message,
        modelId,
        region,
      });
      throw error;
    }
  }

  /**
   * Alias for generateReply to maintain full backwards compatibility.
   */
  public async generateResponse(input: string | ChatMessage[]): Promise<string> {
    return this.generateReply(input);
  }

  /**
   * Performs a safe diagnostic configuration check.
   * Does NOT make network calls or invoke the model.
   */
  public checkConfiguration(): { ok: boolean; region?: string; modelId?: string; error?: string } {
    try {
      const region = this.getRegion();
      const modelId = this.getModelId();
      return { ok: true, region, modelId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid configuration';
      return { ok: false, error: message };
    }
  }

  /**
   * Performs an active, minimal model test invocation.
   * Warning: Incurs minimal AWS Bedrock token usage charges.
   */
  public async testInvocation(): Promise<{ ok: boolean; latencyMs: number; modelId: string; responseSnippet: string }> {
    const startTime = Date.now();
    const reply = await this.generateReply('ping');
    const latencyMs = Date.now() - startTime;
    return {
      ok: true,
      latencyMs,
      modelId: this.getModelId(),
      responseSnippet: reply.substring(0, 100),
    };
  }
}

// Export default singleton instance
export const bedrockService = new BedrockService();

/**
 * Reusable standalone function as required by specification:
 * generateReply(message: string): Promise<string>
 */
export async function generateReply(message: string): Promise<string> {
  return bedrockService.generateReply(message);
}
