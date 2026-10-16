"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var dotenv_1 = require("dotenv");
// Load environment variables immediately before any other module initializations
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
    awsRegion: process.env.AWS_REGION,
    bedrockModelId: process.env.BEDROCK_MODEL_ID,
    maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10),
};
