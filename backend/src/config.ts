import * as dotenv from 'dotenv';

// Load environment variables immediately before any other module initializations
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  awsRegion: process.env.AWS_REGION || 'ap-southeast-2',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0',
  maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10),
  // Amazon Cognito configuration
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
  cognitoRegion: process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-southeast-2',
  // DynamoDB configuration
  dynamoDbTableName: process.env.DYNAMODB_TABLE_NAME || 'LongTermMemory',
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
};
