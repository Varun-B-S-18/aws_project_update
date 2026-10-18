import "dotenv/config";
import { openSearchClient } from "./src/services/memory/openSearchClient";

async function viewMemories() {
  try {
    const response = await openSearchClient.search({
      index: process.env.OPENSEARCH_INDEX!,
      body: {
        query: {
          match_all: {},
        },
        size: 10,
        _source: ["userId", "content", "memoryId", "createdAt", "embedding"],
      },
    });

    console.dir(response.body.hits.hits, {
      depth: null,
      colors: true,
    });
  } catch (error) {
    console.error("Failed to retrieve memories:", error);
  }
}

viewMemories();
