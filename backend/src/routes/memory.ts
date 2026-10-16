import { Router, Request, Response } from "express";
import {
  saveMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  deleteAllMemories,
} from "../services/dynamodb";
import { authenticateToken } from "../middleware/auth";

export const memoryRouter = Router();

// Apply authentication middleware to all memory routes
memoryRouter.use(authenticateToken);

/**
 * GET /api/memories
 * Retrieves all stored memories belonging to the authenticated user.
 */
memoryRouter.get("/memories", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
 * Supports fetching a specific memory by recordId, or fetching memories by userId (strictly authorized).
 */
memoryRouter.get("/memories/:identifier", async (req: Request, res: Response) => {
  try {
    const authUserId = req.user!.userId;
    const identifier = req.params.identifier;

    if (!identifier || identifier.length > 128) {
      return res.status(400).json({
        error: "Invalid memory identifier",
        code: "INVALID_IDENTIFIER",
      });
    }

    // Backward-compatible check: if the client requested /api/memories/:userId
    if (identifier === authUserId) {
      const memories = await getMemories(authUserId);
      return res.status(200).json({ memories, count: memories.length });
    }

    // If identifier is for another user, strictly deny access
    if (identifier.startsWith("user-") && identifier !== authUserId) {
      return res.status(403).json({
        error: "Access denied. You cannot access another user's memories.",
        code: "FORBIDDEN",
      });
    }

    // Treat identifier as a recordId for the authenticated user
    const memory = await getMemoryById(authUserId, identifier);

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
 * Creates a new memory for the authenticated user.
 * Client-supplied userId is ignored for security.
 */
memoryRouter.post("/memory", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
 * Updates an existing memory belonging to the authenticated user.
 */
memoryRouter.put("/memories/:recordId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
        error: "Memory record not found or does not belong to you",
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
 * Deletes a single memory record belonging to the authenticated user.
 */
memoryRouter.delete("/memories/:recordId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
        error: "Memory record not found or does not belong to you",
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
 * Clears all memories belonging to the authenticated user.
 */
memoryRouter.delete("/memories", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
