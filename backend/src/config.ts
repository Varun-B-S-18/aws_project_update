import * as dotenv from 'dotenv';
import dns from 'dns';

// Ensure IPv4 is prioritized over IPv6 on Windows/Node.js to prevent TLS/socket connection drops to AWS endpoints
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Load environment variables immediately before any other module initializations
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  awsRegion: process.env.AWS_REGION || 'ap-southeast-2',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0',
  bedrockEmbeddingModelId: process.env.BEDROCK_EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v2:0',
  maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10),
  defaultUserId: process.env.DEFAULT_USER_ID || 'test-user-1',
  dynamoDbTableName: process.env.DYNAMODB_TABLE_NAME || 'LongTermMemory',
  // Amazon OpenSearch Serverless configuration
  openSearchEndpoint: process.env.OPENSEARCH_ENDPOINT || 'https://nnyu50j5p0jjogkqmgj9.aoss.ap-southeast-2.on.aws',
  openSearchIndex: process.env.OPENSEARCH_INDEX || 'long-term-memories',
  // Amazon Cognito configuration
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
  cognitoRegion: process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-southeast-2',
  nodeEnv: process.env.NODE_ENV || 'development',
};
