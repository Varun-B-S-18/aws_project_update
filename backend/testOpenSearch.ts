import "dotenv/config";
import { openSearchClient } from "./src/services/memory/openSearchClient";

async function createMemoryIndex() {
  const indexName = process.env.OPENSEARCH_INDEX!;

  try {
    const exists = await openSearchClient.indices.exists({
      index: indexName,
    });

    if (exists.body) {
      console.log(`Index "${indexName}" already exists.`);
      return;
    }

    await openSearchClient.indices.create({
      index: indexName,
      body: {
        settings: {
          index: {
            knn: true,
          },
        },
        mappings: {
          properties: {
            memoryId: {
              type: "keyword",
            },
            userId: {
              type: "keyword",
            },
            content: {
              type: "text",
            },
            embedding: {
              type: "knn_vector",
              dimension: 1024,
              method: {
                name: "hnsw",
                space_type: "l2",
              },
            },
            createdAt: {
              type: "date",
            },
          },
        },
      },
    });

    console.log(`Index "${indexName}" created successfully!`);
  } catch (error: any) {
    console.error("Failed to create memory index:");
    console.error("Status:", error.statusCode);
    console.error("Response:", error.body ?? error.message);
  }
}

createMemoryIndex();
