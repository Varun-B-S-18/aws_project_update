import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { config } from "../config";

const region = config.awsRegion || process.env.AWS_REGION || "ap-southeast-2";
const tableName = config.dynamoDbTableName || process.env.DYNAMODB_TABLE_NAME || "LongTermMemory";

let clientInstance: DynamoDBClient | null = null;
let dbInstance: DynamoDBDocumentClient | null = null;

function getDb(): DynamoDBDocumentClient {
  if (!dbInstance) {
    clientInstance = new DynamoDBClient({ region });
    dbInstance = DynamoDBDocumentClient.from(clientInstance, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return dbInstance;
}

export interface Memory {
  userId: string;
  recordId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  category?: string;
}

/**
 * Saves a new memory for the specified authenticated user in DynamoDB.
 * Enforces schema compatibility with existing records.
 */
export async function saveMemory(
  userId: string,
  content: string,
  category?: string
): Promise<Memory> {
  const db = getDb();
  const trimmedContent = content.trim();

  // Avoid creating an exact duplicate memory if the user already has the same active content recently
  const existingMemories = await getMemories(userId);
  const duplicate = existingMemories.find(
    (m) => m.content.trim().toLowerCase() === trimmedContent.toLowerCase()
  );
  if (duplicate) {
    console.log(`[DynamoDB] Reusing existing duplicate memory ${duplicate.recordId}`);
    return duplicate;
  }

  const timestamp = new Date().toISOString();
  const memory: Memory = {
    userId,
    recordId: `memory-${randomUUID()}`,
    content: trimmedContent,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(category ? { category } : {}),
  };

  await db.send(
    new PutCommand({
      TableName: tableName,
      Item: memory,
    })
  );

  console.log(`[DynamoDB] Saved new memory: ${memory.recordId} for user: ${userId}`);
  return memory;
}

/**
 * Retrieves all memory records for an authenticated user from DynamoDB.
 */
export async function getMemories(userId: string, limit?: number): Promise<Memory[]> {
  const db = getDb();

  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    ...(limit ? { Limit: limit } : {}),
  });

  const result = await db.send(command);
  const items = (result.Items || []) as Memory[];

  // Sort chronologically (newest first for UI dashboard, or stable order)
  return items.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Retrieves a single memory by userId and recordId.
 */
export async function getMemoryById(userId: string, recordId: string): Promise<Memory | null> {
  const db = getDb();

  const result = await db.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        userId,
        recordId,
      },
    })
  );

  return (result.Item as Memory) || null;
}

/**
 * Updates an existing memory record's content, verifying ownership by partition key (userId).
 */
export async function updateMemory(
  userId: string,
  recordId: string,
  newContent: string
): Promise<Memory | null> {
  const db = getDb();
  const updatedAt = new Date().toISOString();

  try {
    const result = await db.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          userId,
          recordId,
        },
        UpdateExpression: "SET content = :content, updatedAt = :updatedAt",
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(recordId)",
        ExpressionAttributeValues: {
          ":content": newContent.trim(),
          ":updatedAt": updatedAt,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    console.log(`[DynamoDB] Updated memory: ${recordId} for user: ${userId}`);
    return (result.Attributes as Memory) || null;
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    if (err.name === "ConditionalCheckFailedException") {
      return null; // Record not found or does not belong to user
    }
    throw error;
  }
}

/**
 * Deletes a single memory record, verifying ownership by partition key (userId).
 */
export async function deleteMemory(userId: string, recordId: string): Promise<boolean> {
  const db = getDb();

  try {
    await db.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          userId,
          recordId,
        },
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(recordId)",
      })
    );

    console.log(`[DynamoDB] Deleted memory: ${recordId} for user: ${userId}`);
    return true;
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    if (err.name === "ConditionalCheckFailedException") {
      return false; // Record not found or does not belong to user
    }
    throw error;
  }
}

/**
 * Deletes all memories belonging to an authenticated user after explicit confirmation.
 */
export async function deleteAllMemories(userId: string): Promise<number> {
  const db = getDb();
  const memories = await getMemories(userId);

  if (memories.length === 0) {
    return 0;
  }

  // DynamoDB BatchWriteItem supports up to 25 items per batch
  const batchSize = 25;
  let deletedCount = 0;

  for (let i = 0; i < memories.length; i += batchSize) {
    const chunk = memories.slice(i, i + batchSize);
    const deleteRequests = chunk.map((m) => ({
      DeleteRequest: {
        Key: {
          userId: m.userId,
          recordId: m.recordId,
        },
      },
    }));

    await db.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests,
        },
      })
    );

    deletedCount += chunk.length;
  }

  console.log(`[DynamoDB] Deleted all ${deletedCount} memories for user: ${userId}`);
  return deletedCount;
}
