import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: "ap-southeast-2",
});

interface MemoryExtractionResult {
  success: boolean;
  memories: string[];
}

export async function extractMemoriesWithLambda(
  message: string,
): Promise<string[]> {
  const command = new InvokeCommand({
    FunctionName: "long-term-memory-processor",
    InvocationType: "RequestResponse",
    Payload: Buffer.from(JSON.stringify({ message })),
  });

  const response = await lambdaClient.send(command);

  if (response.FunctionError) {
    throw new Error(`Lambda execution failed: ${response.FunctionError}`);
  }

  if (!response.Payload) {
    throw new Error("Lambda returned an empty payload");
  }

  const lambdaResponse = JSON.parse(
    Buffer.from(response.Payload).toString("utf8"),
  );

  if (lambdaResponse.statusCode !== 200 || !lambdaResponse.body) {
    throw new Error("Memory extraction failed in Lambda");
  }

  const result = JSON.parse(lambdaResponse.body) as MemoryExtractionResult;

  if (
    result.success !== true ||
    !Array.isArray(result.memories) ||
    !result.memories.every(
      (memory) => typeof memory === "string" && memory.trim().length > 0,
    )
  ) {
    throw new Error("Lambda returned invalid memories");
  }

  return result.memories;
}
