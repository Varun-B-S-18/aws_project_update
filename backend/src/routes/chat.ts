import { Router, Request, Response } from "express";
import { bedrockService } from "../services/bedrock";
import {
  ChatRequest,
  ChatResponse,
  ErrorResponse,
  HealthResponse,
  BedrockHealthResponse,
  ChatMessage,
} from "../types/chat";
import { getMemories, saveMemory } from "../services/dynamodb";
import { authenticateToken } from "../middleware/auth";
import { extractMemoryFromMessage } from "../services/memoryExtraction";

export const chatRouter = Router();

const MAX_MESSAGE_LENGTH = 10000;

export async function buildMessageWithMemories(
  userId: string,
  message: string
): Promise<{ augmentedPrompt: string; memoriesUsed: boolean; memoryCount: number }> {
  try {
    const memories = await getMemories(userId);

    if (memories.length === 0) {
      return { augmentedPrompt: message, memoriesUsed: false, memoryCount: 0 };
    }

    // Take up to 15 relevant memories and present in chronological order
    const selectedMemories = memories
      .slice(0, 15)
      .reverse();

    const memoryContext = selectedMemories
      .map((memory) => `- ${memory.content}`)
      .join("\n");

    console.log(`[Memory Debug] Retrieved ${selectedMemories.length} memories for user: ${userId}`);

    const prompt = `You are a helpful assistant with long-term memory.

Relevant information remembered about the user:
${memoryContext}

Use these memories when relevant to answer the user's question. Do not invent personal information. If the memories do not answer the question, say so naturally.

User's current message:
${message}`;

    return {
      augmentedPrompt: prompt,
      memoriesUsed: true,
      memoryCount: selectedMemories.length,
    };
  } catch (error) {
    console.error("Failed to retrieve memories:", error);
    return { augmentedPrompt: message, memoriesUsed: false, memoryCount: 0 };
  }
}

/**
 * Diagnostic helper to format safe, user-friendly error messages from AWS/Bedrock failures
 * without leaking credentials, tokens, or internal stack traces.
 */
function formatBedrockError(error: unknown): {
  status: number;
  message: string;
  code: string;
} {
  const err = error as Error & { code?: string; name?: string };
  const errorName = err.name || "UnknownError";
  const errorMessage = err.message || "";

  // Configuration error (missing env variables)
  if (errorMessage.includes("Missing required")) {
    return {
      status: 500,
      code: "CONFIGURATION_ERROR",
      message:
        "Server configuration error: AWS_REGION or BEDROCK_MODEL_ID is not configured.",
    };
  }

  // Operation not allowed (often means model access has not been granted in AWS Console)
  if (
    errorName === "ValidationException" &&
    errorMessage.includes("Operation not allowed")
  ) {
    return {
      status: 403,
      code: "MODEL_ACCESS_REQUIRED",
      message:
        'Amazon Bedrock access denied: Model access is not granted in the AWS Console for this model/region. Please enable model access in the AWS Bedrock Console under "Model access".',
    };
  }

  // Model end-of-life or retired
  if (
    errorName === "ResourceNotFoundException" &&
    errorMessage.includes("end of its life")
  ) {
    return {
      status: 404,
      code: "MODEL_END_OF_LIFE",
      message:
        "The configured Bedrock model has reached end of life. Please update BEDROCK_MODEL_ID to an active model or inference profile (e.g. amazon.nova-micro-v1:0).",
    };
  }

  // Resource not found (invalid model or wrong region)
  if (errorName === "ResourceNotFoundException") {
    return {
      status: 404,
      code: "MODEL_NOT_FOUND",
      message:
        "The requested Amazon Bedrock model was not found in the configured AWS region. Please verify the BEDROCK_MODEL_ID and AWS_REGION.",
    };
  }

  // Access Denied / IAM permissions
  if (errorName === "AccessDeniedException") {
    return {
      status: 403,
      code: "ACCESS_DENIED",
      message:
        "AWS Access Denied. Please ensure your IAM user has the bedrock:InvokeModel permission and model access is granted.",
    };
  }

  // Missing or invalid AWS credentials
  if (
    errorName === "CredentialsProviderError" ||
    errorName === "UnrecognizedClientException" ||
    errorMessage.includes("Could not load credentials")
  ) {
    return {
      status: 500,
      code: "CREDENTIALS_MISSING",
      message:
        'AWS credentials could not be loaded. Please configure AWS credentials via "aws configure" or environment variables.',
    };
  }

  // Throttling
  if (errorName === "ThrottlingException") {
    return {
      status: 429,
      code: "THROTTLED",
      message:
        "Amazon Bedrock rate limit exceeded. Please wait a moment and try again.",
    };
  }

  // Default fallback
  return {
    status: 500,
    code: "BEDROCK_INVOCATION_FAILED",
    message:
      "Unable to generate a response from Amazon Bedrock. Please try again.",
  };
}

/**
 * GET /api/health
 * Simple health check endpoint for verifying service availability.
 */
chatRouter.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({ status: "ok" });
});

/**
 * GET /api/health/bedrock
 * Diagnostic health check endpoint for Amazon Bedrock integration.
 * Optional query: ?test=true to trigger a minimal live invocation test.
 */
chatRouter.get(
  "/health/bedrock",
  async (req: Request, res: Response<BedrockHealthResponse>) => {
    const shouldTest = req.query.test === "true";
    const configCheck = bedrockService.checkConfiguration();

    if (!configCheck.ok) {
      return res.status(500).json({
        status: "error",
        error: configCheck.error,
        code: "CONFIGURATION_ERROR",
        note: "Required environment variables (AWS_REGION, BEDROCK_MODEL_ID) are missing.",
      });
    }

    if (!shouldTest) {
      // Configuration-only verification (no model invocation charges)
      return res.status(200).json({
        status: "configured",
        region: configCheck.region,
        modelId: configCheck.modelId,
        message:
          "Amazon Bedrock configuration is present. Pass ?test=true to execute a live test invocation.",
        note: "Live invocation test (?test=true) may incur AWS Bedrock usage charges.",
      });
    }

    // Active live invocation test
    try {
      const result = await bedrockService.testInvocation();
      return res.status(200).json({
        status: "connected",
        region: configCheck.region,
        modelId: result.modelId,
        latencyMs: result.latencyMs,
        message:
          "Successfully connected and received response from Amazon Bedrock.",
      });
    } catch (error: unknown) {
      const errDiagnostic = formatBedrockError(error);
      return res.status(errDiagnostic.status).json({
        status: "error",
        region: configCheck.region,
        modelId: configCheck.modelId,
        error: errDiagnostic.message,
        code: errDiagnostic.code,
      });
    }
  },
);

/**
 * POST /api/chat
 * Handles user chat input, retrieves authenticated user memories from DynamoDB,
 * forwards request to Amazon Bedrock, and extracts meaningful persistent memories.
 */
chatRouter.post(
  "/chat",
  authenticateToken,
  async (
    req: Request<unknown, unknown, ChatRequest>,
    res: Response<ChatResponse | ErrorResponse>,
  ) => {
    // Validate request body exists
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error:
          "Invalid request body. Expected JSON object with message or messages.",
      });
    }

    const userId = req.user!.userId;
    const { message, messages } = req.body;

    // Validate presence of at least one input format
    if (!message && (!messages || !Array.isArray(messages))) {
      return res.status(400).json({
        error: "Message cannot be empty",
      });
    }

    // Case 1: Single message payload {"message": "..."}
    if (typeof message === "string") {
      const trimmed = message.trim();
      if (!trimmed) {
        return res.status(400).json({
          error: "Message cannot be empty",
        });
      }

      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters`,
        });
      }

      try {
        // Retrieve saved memories for the authenticated user and include them in the prompt
        const memoryResult = await buildMessageWithMemories(userId, trimmed);

        // Generate a reply using Amazon Bedrock
        const reply = await bedrockService.generateReply(memoryResult.augmentedPrompt);

        // Intelligently evaluate whether this message contains personal facts/preferences to remember
        const memoryExtract = extractMemoryFromMessage(trimmed);
        if (memoryExtract.shouldSave && memoryExtract.content) {
          try {
            await saveMemory(userId, memoryExtract.content, memoryExtract.category);
          } catch (memoryError) {
            console.error("[ChatRoute] Non-fatal error saving extracted memory:", memoryError);
          }
        }

        return res.status(200).json({
          reply,
          message: reply,
          memoriesUsed: memoryResult.memoriesUsed,
          memoryCount: memoryResult.memoryCount,
        });
      } catch (error: unknown) {
        const diagnostic = formatBedrockError(error);
        return res.status(diagnostic.status).json({
          error: diagnostic.message,
          code: diagnostic.code,
        });
      }
    }

    // Case 2: Conversation history payload {"messages": [...]}
    if (Array.isArray(messages)) {
      if (messages.length === 0) {
        return res.status(400).json({
          error: "Message cannot be empty",
        });
      }

      // Validate structure of messages array
      const isValid = messages.every(
        (m: ChatMessage) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0 &&
          m.content.length <= MAX_MESSAGE_LENGTH,
      );

      if (!isValid) {
        return res.status(400).json({
          error: "Message cannot be empty or exceeds allowed length limit",
        });
      }

      try {
        // Augment the last user message with long-term memories
        const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
        let memoryResult = { augmentedPrompt: "", memoriesUsed: false, memoryCount: 0 };

        const formattedMessages = messages.map((m) => ({ ...m }));

        if (lastUserIdx !== -1) {
          const actualIdx = messages.length - 1 - lastUserIdx;
          const userContent = messages[actualIdx].content;
          memoryResult = await buildMessageWithMemories(userId, userContent);
          formattedMessages[actualIdx].content = memoryResult.augmentedPrompt;

          // Intelligently save personal facts from the last user message
          const memoryExtract = extractMemoryFromMessage(userContent);
          if (memoryExtract.shouldSave && memoryExtract.content) {
            try {
              await saveMemory(userId, memoryExtract.content, memoryExtract.category);
            } catch (memoryError) {
              console.error("[ChatRoute] Non-fatal error saving extracted memory:", memoryError);
            }
          }
        }

        const reply = await bedrockService.generateReply(formattedMessages);

        return res.status(200).json({
          reply,
          message: reply, // Backward-compatibility alias
          memoriesUsed: memoryResult.memoriesUsed,
          memoryCount: memoryResult.memoryCount,
        });
      } catch (error: unknown) {
        const diagnostic = formatBedrockError(error);
        return res.status(diagnostic.status).json({
          error: diagnostic.message,
          code: diagnostic.code,
        });
      }
    }

    return res.status(400).json({
      error: "Message cannot be empty",
    });
  },
);
