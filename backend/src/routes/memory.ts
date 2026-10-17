import { Router, Request, Response } from "express";
import {
  saveMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  deleteAllMemories,
} from "../services/dynamodb";
import { config } from "../config";

export const memoryRouter = Router();

/**
 * Resolves the target user ID for memory operations in local development.
 * Defaults to "test-user-1" without requiring authentication.
 */
function getUserId(req: Request): string {
  return (
    (req.query?.userId as string) ||
    (req.body && req.body.userId) ||
    (req.headers["x-user-id"] as string) ||
    config.defaultUserId ||
    "test-user-1"
  );
}

/**
 * GET /api/memories
 * Retrieves all stored memories for the development user.
 */
memoryRouter.get("/memories", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const memories = await getMemories(userId);

    return res.status(200).json({
      memories,
      count: memories.length,
    });
  } catch (error) {
    console.error("[MemoryRoute] Failed to retrieve memories:", error);
    return res.status(500).json({
      error: "Failed to retrieve memories",
      code: "RETRIEVE_FAILED",
    });
  }
});

/**
 * GET /api/memories/:identifier
 * Supports fetching a specific memory by recordId, or fetching memories by userId.
 */
memoryRouter.get("/memories/:identifier", async (req: Request, res: Response) => {
  try {
    const identifier = req.params.identifier;

    if (!identifier || identifier.length > 128) {
      return res.status(400).json({
        error: "Invalid memory identifier",
        code: "INVALID_IDENTIFIER",
      });
    }

    // Check if identifier is a userId
    if (identifier.startsWith("user-") || identifier.startsWith("test-user-")) {
      const memories = await getMemories(identifier);
      return res.status(200).json({ memories, count: memories.length });
    }

    // Treat identifier as a recordId
    const userId = getUserId(req);
    const memory = await getMemoryById(userId, identifier);

    if (!memory) {
      return res.status(404).json({
        error: "Memory not found",
        code: "NOT_FOUND",
      });
    }

    return res.status(200).json({ memory });
  } catch (error) {
    console.error("[MemoryRoute] Failed to retrieve memory:", error);
    return res.status(500).json({
      error: "Failed to retrieve memory",
      code: "RETRIEVE_FAILED",
    });
  }
});

/**
 * POST /api/memory
 * Creates a new memory for the user.
 */
memoryRouter.post("/memory", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { content, category } = req.body || {};

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        error: "Content is required and must be a non-empty string",
        code: "INVALID_CONTENT",
      });
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length > 5000) {
      return res.status(400).json({
        error: "Memory content exceeds maximum limit of 5,000 characters",
        code: "CONTENT_TOO_LONG",
      });
    }

    const memory = await saveMemory(userId, trimmedContent, category);

    return res.status(201).json({
      message: "Memory saved successfully",
      memory,
    });
  } catch (error) {
    console.error("[MemoryRoute] Failed to save memory:", error);
    return res.status(500).json({
      error: "Failed to save memory",
      code: "SAVE_FAILED",
    });
  }
});

/**
 * PUT /api/memories/:recordId
 * Updates an existing memory record.
 */
memoryRouter.put("/memories/:recordId", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const recordId = req.params.recordId;
    const { content } = req.body || {};

    if (!recordId || recordId.length > 128) {
      return res.status(400).json({
        error: "Invalid recordId",
        code: "INVALID_RECORD_ID",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        error: "New content is required",
        code: "INVALID_CONTENT",
      });
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length > 5000) {
      return res.status(400).json({
        error: "Memory content exceeds maximum limit of 5,000 characters",
        code: "CONTENT_TOO_LONG",
      });
    }

    const updated = await updateMemory(userId, recordId, trimmedContent);

    if (!updated) {
      return res.status(404).json({
        error: "Memory record not found",
        code: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      message: "Memory updated successfully",
      memory: updated,
    });
  } catch (error) {
    console.error("[MemoryRoute] Failed to update memory:", error);
    return res.status(500).json({
      error: "Failed to update memory",
      code: "UPDATE_FAILED",
    });
  }
});

/**
 * DELETE /api/memories/:recordId
 * Deletes a single memory record.
 */
memoryRouter.delete("/memories/:recordId", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const recordId = req.params.recordId;

    if (!recordId || recordId.length > 128) {
      return res.status(400).json({
        error: "Invalid recordId",
        code: "INVALID_RECORD_ID",
      });
    }

    const deleted = await deleteMemory(userId, recordId);

    if (!deleted) {
      return res.status(404).json({
        error: "Memory record not found",
        code: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      message: "Memory deleted successfully",
      recordId,
    });
  } catch (error) {
    console.error("[MemoryRoute] Failed to delete memory:", error);
    return res.status(500).json({
      error: "Failed to delete memory",
      code: "DELETE_FAILED",
    });
  }
});

/**
 * DELETE /api/memories
 * Clears all memories belonging to the user.
 */
memoryRouter.delete("/memories", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const deletedCount = await deleteAllMemories(userId);

    return res.status(200).json({
      message: "All memories cleared successfully",
      count: deletedCount,
    });
  } catch (error) {
    console.error("[MemoryRoute] Failed to clear memories:", error);
    return res.status(500).json({
      error: "Failed to clear memories",
      code: "CLEAR_FAILED",
    });
  }
});
