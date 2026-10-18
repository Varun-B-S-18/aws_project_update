import "dotenv/config";

import {
  storeMemory,
  searchMemories,
} from "./src/services/memory/memoryService";

async function testMemory() {
  try {
    const userId = "test-user-001";

    console.log("Storing test memory...");

    await storeMemory(
      userId,
      "I prefer backend development using Node.js and Express.",
    );

    console.log("\nSearching for the memory...");

    const memories = await searchMemories(
      userId,
      "Which backend technologies do I prefer?",
      3,
    );

    console.log("\nRetrieved memories:");
    console.dir(memories, { depth: null });
  } catch (error) {
    console.error("Memory test failed:");
    console.error(error);
  }
}

testMemory();
