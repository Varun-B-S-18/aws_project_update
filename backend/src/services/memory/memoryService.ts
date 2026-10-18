import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { openSearchClient } from "./openSearchClient";

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const INDEX_NAME = process.env.OPENSEARCH_INDEX || "long-term-memories";

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId:
        process.env.BEDROCK_EMBEDDING_MODEL_ID ||
        "amazon.titan-embed-text-v2:0",
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
  // Search for an exact duplicate belonging to this user.
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

  if (existing.body.hits.hits.length > 0) {
    console.log("Memory already exists; skipping duplicate.");
    return;
  }

  // Generate the vector only when the memory is new.
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

  console.log("Memory stored successfully!");
}

export async function searchMemories(userId: string, query: string, limit = 3) {
  const embedding = await generateEmbedding(query);

  const response = await openSearchClient.search({
    index: INDEX_NAME,
    body: {
      size: limit,
      query: {
        knn: {
          embedding: {
            vector: embedding,
            k: limit,
          },
        },
      },
    },
  });

  const hits = response.body.hits.hits;

  return hits
    .filter((hit: any) => hit._source.userId === userId)
    .map((hit: any) => ({
      memoryId: hit._source.memoryId,
      content: hit._source.content,
      score: hit._score,
      createdAt: hit._source.createdAt,
    }));
}
