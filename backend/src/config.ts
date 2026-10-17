import * as dotenv from 'dotenv';

// Load environment variables immediately before any other module initializations
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  awsRegion: process.env.AWS_REGION || 'ap-southeast-2',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0',
  maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10),
  defaultUserId: process.env.DEFAULT_USER_ID || 'test-user-1',
  dynamoDbTableName: process.env.DYNAMODB_TABLE_NAME || 'LongTermMemory',
  nodeEnv: process.env.NODE_ENV || 'development',
};
