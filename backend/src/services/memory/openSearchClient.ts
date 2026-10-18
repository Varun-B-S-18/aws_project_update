import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws-v3";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const endpoint = process.env.OPENSEARCH_ENDPOINT;
const region = process.env.AWS_REGION || "ap-southeast-2";

if (!endpoint) {
  throw new Error("OPENSEARCH_ENDPOINT is missing from backend/.env");
}

export const openSearchClient = new Client({
  ...AwsSigv4Signer({
    region,
    service: "aoss",
    getCredentials: () => defaultProvider()(),
  }),
  node: endpoint,
});
