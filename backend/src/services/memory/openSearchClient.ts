import https from "https";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws-v3";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { config } from "../../config";

const endpoint = config.openSearchEndpoint;
const region = config.awsRegion || "ap-southeast-2";

if (!endpoint) {
  throw new Error("OPENSEARCH_ENDPOINT is missing from backend/.env");
}

export const openSearchClient = new Client({
  ...AwsSigv4Signer({
    region,
    service: "aoss",
    getCredentials: defaultProvider(),
  }),
  node: endpoint,
  maxRetries: 3,
  requestTimeout: 30000,
  agent: () =>
    new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000,
    }),
});
