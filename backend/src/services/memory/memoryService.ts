import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { openSearchClient } from "./openSearchClient";
import { config } from "../../config";
import crypto from "crypto";

const bedrock = new BedrockRuntimeClient({
  region: config.awsRegion || "ap-southeast-2",
});

const INDEX_NAME = config.openSearchIndex || "long-term-memories";

export interface RetrievedMemory {
  memoryId: string;
  content: string;
  score: number;
  createdAt: string;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: config.bedrockEmbeddingModelId || "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: text,
        dimensions: 1024,
        normalize: true,
      }),
    }),
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}

export async function storeMemory(
  userId: string,
  content: string,
): Promise<void> {
  try {
    // Search for an exact duplicate belonging to this user
    const existing = await openSearchClient.search({
      index: INDEX_NAME,
      body: {
        size: 1,
        query: {
          bool: {
            filter: [{ term: { userId } }, { match_phrase: { content } }],
          },
        },
      },
    });

    if (existing?.body?.hits?.hits?.length > 0) {
      console.log(`[OpenSearch] Memory already exists for user ${userId}; skipping duplicate.`);
      return;
    }

    // Generate the vector only when the memory is new
    const embedding = await generateEmbedding(content);

    await openSearchClient.index({
      index: INDEX_NAME,
      body: {
        memoryId: crypto.randomUUID(),
        userId,
        content,
        embedding,
        createdAt: new Date().toISOString(),
      },
    });

    console.log(`[OpenSearch] Memory indexed successfully for user ${userId}`);
  } catch (err: any) {
    console.error(`[OpenSearch] Failed to store memory in OpenSearch: ${err?.message || err}`);
    if (err?.meta) {
      console.error("[OpenSearch] Diagnostic meta:", JSON.stringify(err.meta, null, 2));
    }
    // Re-throw so callers can decide on non-fatal handling
    throw err;
  }
}

export async function searchMemories(
  userId: string,
  query: string,
  limit = 3,
): Promise<RetrievedMemory[]> {
  try {
    const embedding = await generateEmbedding(query);

    // Filtered KNN search: search vectors strictly within this user's memories
    const response = await openSearchClient.search({
      index: INDEX_NAME,
      body: {
        size: limit,
        query: {
          knn: {
            embedding: {
              vector: embedding,
              k: limit,
              filter: {
                term: {
                  userId,
                },
              },
            },
          },
        },
      },
    });

    const hits = response?.body?.hits?.hits || [];

    return hits
      .filter((hit: any) => hit._source?.userId === userId)
      .map((hit: any) => ({
        memoryId: hit._source.memoryId,
        content: hit._source.content,
        score: hit._score,
        createdAt: hit._source.createdAt,
      }));
  } catch (err: any) {
    console.error(`[OpenSearch] Memory retrieval failed: ${err?.message || err}`);
    if (err?.meta) {
      console.error("[OpenSearch] Diagnostic meta:", JSON.stringify(err.meta, null, 2));
    }
    // Return empty list gracefully so the chat request proceeds without crashing
    return [];
  }
}
