import { app } from './app';
import { config } from './config';

const PORT = config.port;
const REGION = config.awsRegion || '(Not configured - set AWS_REGION)';
const MODEL_ID = config.bedrockModelId || '(Not configured - set BEDROCK_MODEL_ID)';

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🤖 Long-Term Memory Assistant - Backend`);
  console.log(`   Phase 1: Basic AI Chat Foundation`);
  console.log(`=========================================`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 AWS Region:        ${REGION}`);
  console.log(`🧠 Bedrock Model ID:  ${MODEL_ID}`);
  console.log(`🔒 Credentials:       Standard AWS Provider Chain`);
  console.log(`=========================================`);

  if (!config.awsRegion || !config.bedrockModelId) {
    console.warn(`⚠️  WARNING: Missing AWS_REGION or BEDROCK_MODEL_ID in environment variables.`);
    console.warn(`   Configure them in backend/.env before invoking /api/chat.`);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
