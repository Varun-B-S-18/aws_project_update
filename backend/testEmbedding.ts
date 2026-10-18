import "dotenv/config";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const region = process.env.AWS_REGION || "ap-southeast-2";

const client = new BedrockRuntimeClient({ region });

async function testEmbedding() {
  try {
    const response = await client.send(
      new InvokeModelCommand({
        modelId: process.env.BEDROCK_EMBEDDING_MODEL_ID!,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: "I am building a long-term memory assistant.",
          dimensions: 1024,
          normalize: true,
        }),
      }),
    );

    const result = JSON.parse(new TextDecoder().decode(response.body));

    console.log("Embedding generated successfully!");
    console.log("Embedding dimensions:", result.embedding.length);
    console.log("First five values:", result.embedding.slice(0, 5));
  } catch (error) {
    console.error("Embedding test failed:");
    console.error(error);
  }
}

testEmbedding();
