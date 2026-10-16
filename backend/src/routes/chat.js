"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
var express_1 = require("express");
var bedrock_1 = require("../services/bedrock");
exports.chatRouter = (0, express_1.Router)();
var MAX_MESSAGE_LENGTH = 10000;
/**
 * Diagnostic helper to format safe, user-friendly error messages from AWS/Bedrock failures
 * without leaking credentials, tokens, or internal stack traces.
 */
function formatBedrockError(error) {
    var err = error;
    var errorName = err.name || 'UnknownError';
    var errorMessage = err.message || '';
    // Configuration error (missing env variables)
    if (errorMessage.includes('Missing required')) {
        return {
            status: 500,
            code: 'CONFIGURATION_ERROR',
            message: 'Server configuration error: AWS_REGION or BEDROCK_MODEL_ID is not configured.',
        };
    }
    // Operation not allowed (often means model access has not been granted in AWS Console)
    if (errorName === 'ValidationException' && errorMessage.includes('Operation not allowed')) {
        return {
            status: 403,
            code: 'MODEL_ACCESS_REQUIRED',
            message: 'Amazon Bedrock access denied: Model access is not granted in the AWS Console for this model/region. Please enable model access in the AWS Bedrock Console under "Model access".',
        };
    }
    // Model end-of-life or retired
    if (errorName === 'ResourceNotFoundException' && errorMessage.includes('end of its life')) {
        return {
            status: 404,
            code: 'MODEL_END_OF_LIFE',
            message: 'The configured Bedrock model has reached end of life. Please update BEDROCK_MODEL_ID to an active model or inference profile (e.g. amazon.nova-micro-v1:0).',
        };
    }
    // Resource not found (invalid model or wrong region)
    if (errorName === 'ResourceNotFoundException') {
        return {
            status: 404,
            code: 'MODEL_NOT_FOUND',
            message: 'The requested Amazon Bedrock model was not found in the configured AWS region. Please verify the BEDROCK_MODEL_ID and AWS_REGION.',
        };
    }
    // Access Denied / IAM permissions
    if (errorName === 'AccessDeniedException') {
        return {
            status: 403,
            code: 'ACCESS_DENIED',
            message: 'AWS Access Denied. Please ensure your IAM user has the bedrock:InvokeModel permission and model access is granted.',
        };
    }
    // Missing or invalid AWS credentials
    if (errorName === 'CredentialsProviderError' ||
        errorName === 'UnrecognizedClientException' ||
        errorMessage.includes('Could not load credentials')) {
        return {
            status: 500,
            code: 'CREDENTIALS_MISSING',
            message: 'AWS credentials could not be loaded. Please configure AWS credentials via "aws configure" or environment variables.',
        };
    }
    // Throttling
    if (errorName === 'ThrottlingException') {
        return {
            status: 429,
            code: 'THROTTLED',
            message: 'Amazon Bedrock rate limit exceeded. Please wait a moment and try again.',
        };
    }
    // Default fallback
    return {
        status: 500,
        code: 'BEDROCK_INVOCATION_FAILED',
        message: 'Unable to generate a response from Amazon Bedrock. Please try again.',
    };
}
/**
 * GET /api/health
 * Simple health check endpoint for verifying service availability.
 */
exports.chatRouter.get('/health', function (_req, res) {
    res.status(200).json({ status: 'ok' });
});
/**
 * GET /api/health/bedrock
 * Diagnostic health check endpoint for Amazon Bedrock integration.
 * Optional query: ?test=true to trigger a minimal live invocation test.
 */
exports.chatRouter.get('/health/bedrock', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var shouldTest, configCheck, result, error_1, errDiagnostic;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                shouldTest = req.query.test === 'true';
                configCheck = bedrock_1.bedrockService.checkConfiguration();
                if (!configCheck.ok) {
                    return [2 /*return*/, res.status(500).json({
                            status: 'error',
                            error: configCheck.error,
                            code: 'CONFIGURATION_ERROR',
                            note: 'Required environment variables (AWS_REGION, BEDROCK_MODEL_ID) are missing.',
                        })];
                }
                if (!shouldTest) {
                    // Configuration-only verification (no model invocation charges)
                    return [2 /*return*/, res.status(200).json({
                            status: 'configured',
                            region: configCheck.region,
                            modelId: configCheck.modelId,
                            message: 'Amazon Bedrock configuration is present. Pass ?test=true to execute a live test invocation.',
                            note: 'Live invocation test (?test=true) may incur AWS Bedrock usage charges.',
                        })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, bedrock_1.bedrockService.testInvocation()];
            case 2:
                result = _a.sent();
                return [2 /*return*/, res.status(200).json({
                        status: 'connected',
                        region: configCheck.region,
                        modelId: result.modelId,
                        latencyMs: result.latencyMs,
                        message: 'Successfully connected and received response from Amazon Bedrock.',
                    })];
            case 3:
                error_1 = _a.sent();
                errDiagnostic = formatBedrockError(error_1);
                return [2 /*return*/, res.status(errDiagnostic.status).json({
                        status: 'error',
                        region: configCheck.region,
                        modelId: configCheck.modelId,
                        error: errDiagnostic.message,
                        code: errDiagnostic.code,
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/chat
 * Handles user chat input and forwards request to Amazon Bedrock.
 */
exports.chatRouter.post('/chat', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, message, messages, trimmed, reply, error_2, diagnostic, isValid, reply, error_3, diagnostic;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // Validate request body exists
                if (!req.body || typeof req.body !== 'object') {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Invalid request body. Expected JSON object with message or messages.',
                        })];
                }
                _a = req.body, message = _a.message, messages = _a.messages;
                // Validate presence of at least one input format
                if (!message && (!messages || !Array.isArray(messages))) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Message cannot be empty',
                        })];
                }
                if (!(typeof message === 'string')) return [3 /*break*/, 4];
                trimmed = message.trim();
                if (!trimmed) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Message cannot be empty',
                        })];
                }
                if (trimmed.length > MAX_MESSAGE_LENGTH) {
                    return [2 /*return*/, res.status(400).json({
                            error: "Message exceeds maximum allowed length of ".concat(MAX_MESSAGE_LENGTH, " characters"),
                        })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, bedrock_1.bedrockService.generateReply(trimmed)];
            case 2:
                reply = _b.sent();
                return [2 /*return*/, res.status(200).json({
                        reply: reply,
                        message: reply, // Backward-compatibility alias
                    })];
            case 3:
                error_2 = _b.sent();
                diagnostic = formatBedrockError(error_2);
                return [2 /*return*/, res.status(diagnostic.status).json({
                        error: diagnostic.message,
                        code: diagnostic.code,
                    })];
            case 4:
                if (!Array.isArray(messages)) return [3 /*break*/, 8];
                if (messages.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Message cannot be empty',
                        })];
                }
                isValid = messages.every(function (m) {
                    return m &&
                        (m.role === 'user' || m.role === 'assistant') &&
                        typeof m.content === 'string' &&
                        m.content.trim().length > 0 &&
                        m.content.length <= MAX_MESSAGE_LENGTH;
                });
                if (!isValid) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Message cannot be empty or exceeds allowed length limit',
                        })];
                }
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, bedrock_1.bedrockService.generateReply(messages)];
            case 6:
                reply = _b.sent();
                return [2 /*return*/, res.status(200).json({
                        reply: reply,
                        message: reply, // Backward-compatibility alias
                    })];
            case 7:
                error_3 = _b.sent();
                diagnostic = formatBedrockError(error_3);
                return [2 /*return*/, res.status(diagnostic.status).json({
                        error: diagnostic.message,
                        code: diagnostic.code,
                    })];
            case 8: return [2 /*return*/, res.status(400).json({
                    error: 'Message cannot be empty',
                })];
        }
    });
}); });
