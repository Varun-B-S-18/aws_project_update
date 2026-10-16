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
var supertest_1 = require("supertest");
var app_1 = require("../src/app");
var bedrock_1 = require("../src/services/bedrock");
// Mock the BedrockService so tests do not make external AWS calls or incur charges
jest.mock('../src/services/bedrock', function () { return ({
    bedrockService: {
        generateReply: jest.fn(),
        generateResponse: jest.fn(),
        getModelId: jest.fn().mockReturnValue('amazon.nova-micro-v1:0'),
        getRegion: jest.fn().mockReturnValue('us-east-1'),
        checkConfiguration: jest.fn().mockReturnValue({
            ok: true,
            region: 'us-east-1',
            modelId: 'amazon.nova-micro-v1:0',
        }),
        testInvocation: jest.fn(),
    },
    generateReply: jest.fn(),
}); });
describe('Backend API - Phase 1 Basic AI Chat & Bedrock Diagnostic', function () {
    beforeEach(function () {
        jest.clearAllMocks();
    });
    describe('GET /api/health', function () {
        it('should return status ok with 200 status code', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.app).get('/api/health')];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(200);
                        expect(response.body).toEqual({ status: 'ok' });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('GET /api/health/bedrock', function () {
        it('should return configured status without invoking model when test flag is absent', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.app).get('/api/health/bedrock')];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(200);
                        expect(response.body.status).toBe('configured');
                        expect(response.body.region).toBe('us-east-1');
                        expect(response.body.modelId).toBe('amazon.nova-micro-v1:0');
                        expect(bedrock_1.bedrockService.testInvocation).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return connected status when test=true and invocation succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bedrock_1.bedrockService.testInvocation.mockResolvedValueOnce({
                            ok: true,
                            latencyMs: 142,
                            modelId: 'amazon.nova-micro-v1:0',
                            responseSnippet: 'pong',
                        });
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app).get('/api/health/bedrock?test=true')];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(200);
                        expect(response.body.status).toBe('connected');
                        expect(response.body.latencyMs).toBe(142);
                        expect(bedrock_1.bedrockService.testInvocation).toHaveBeenCalledTimes(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should report configuration error when env vars are missing', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bedrock_1.bedrockService.checkConfiguration.mockReturnValueOnce({
                            ok: false,
                            error: 'Missing required AWS Region configuration.',
                        });
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app).get('/api/health/bedrock')];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(500);
                        expect(response.body.status).toBe('error');
                        expect(response.body.code).toBe('CONFIGURATION_ERROR');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return safe diagnostic error when test=true fails with AWS error', function () { return __awaiter(void 0, void 0, void 0, function () {
            var awsError, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        awsError = new Error('AccessDeniedException: User is not authorized');
                        awsError.name = 'AccessDeniedException';
                        bedrock_1.bedrockService.testInvocation.mockRejectedValueOnce(awsError);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app).get('/api/health/bedrock?test=true')];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(403);
                        expect(response.body.status).toBe('error');
                        expect(response.body.code).toBe('ACCESS_DENIED');
                        expect(response.body).not.toHaveProperty('stack');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('POST /api/chat', function () {
        it('should return 200 with reply and message for a valid single message', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockAiReply, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockAiReply = 'Artificial intelligence is computer systems performing human-like tasks.';
                        bedrock_1.bedrockService.generateReply.mockResolvedValueOnce(mockAiReply);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                                .post('/api/chat')
                                .send({ message: 'Explain artificial intelligence in simple terms.' })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(200);
                        expect(response.body).toEqual({
                            reply: mockAiReply,
                            message: mockAiReply,
                        });
                        expect(bedrock_1.bedrockService.generateReply).toHaveBeenCalledWith('Explain artificial intelligence in simple terms.');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 200 and AI response for a valid conversation history payload', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockAiReply, messages, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockAiReply = 'Your name is Alex.';
                        bedrock_1.bedrockService.generateReply.mockResolvedValueOnce(mockAiReply);
                        messages = [
                            { role: 'user', content: 'My name is Alex.' },
                            { role: 'assistant', content: 'Nice to meet you, Alex.' },
                            { role: 'user', content: 'What is my name?' },
                        ];
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                                .post('/api/chat')
                                .send({ messages: messages })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(200);
                        expect(response.body).toEqual({
                            reply: mockAiReply,
                            message: mockAiReply,
                        });
                        expect(bedrock_1.bedrockService.generateReply).toHaveBeenCalledWith(messages);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 400 when message is empty string', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                            .post('/api/chat')
                            .send({ message: '   ' })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(400);
                        expect(response.body).toEqual({ error: 'Message cannot be empty' });
                        expect(bedrock_1.bedrockService.generateReply).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 400 when message exceeds max allowed length', function () { return __awaiter(void 0, void 0, void 0, function () {
            var longMessage, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        longMessage = 'A'.repeat(10001);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                                .post('/api/chat')
                                .send({ message: longMessage })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(400);
                        expect(response.body.error).toContain('Message exceeds maximum allowed length');
                        expect(bedrock_1.bedrockService.generateReply).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 400 when request body is empty object', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                            .post('/api/chat')
                            .send({})];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(400);
                        expect(response.body).toEqual({ error: 'Message cannot be empty' });
                        expect(bedrock_1.bedrockService.generateReply).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 400 when messages array contains invalid items', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                            .post('/api/chat')
                            .send({ messages: [{ role: 'unknown', content: '' }] })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(400);
                        expect(response.body.error).toBe('Message cannot be empty or exceeds allowed length limit');
                        expect(bedrock_1.bedrockService.generateReply).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return friendly error when AWS model access is not granted (ValidationException)', function () { return __awaiter(void 0, void 0, void 0, function () {
            var valError, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        valError = new Error('Operation not allowed');
                        valError.name = 'ValidationException';
                        bedrock_1.bedrockService.generateReply.mockRejectedValueOnce(valError);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                                .post('/api/chat')
                                .send({ message: 'Hello Bedrock' })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(403);
                        expect(response.body.code).toBe('MODEL_ACCESS_REQUIRED');
                        expect(response.body.error).toContain('Model access is not granted');
                        expect(response.body).not.toHaveProperty('stack');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return 500 and safe error message when general Bedrock service fails', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bedrock_1.bedrockService.generateReply.mockRejectedValueOnce(new Error('Network timeout connecting to AWS Bedrock'));
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.app)
                                .post('/api/chat')
                                .send({ message: 'Explain quantum computing' })];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toBe(500);
                        expect(response.body).toEqual({
                            error: 'Unable to generate a response from Amazon Bedrock. Please try again.',
                            code: 'BEDROCK_INVOCATION_FAILED',
                        });
                        // Ensure AWS internal error details and stack traces are not exposed
                        expect(response.body).not.toHaveProperty('stack');
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
