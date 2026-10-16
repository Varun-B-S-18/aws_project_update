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
exports.bedrockService = exports.BedrockService = void 0;
exports.generateReply = generateReply;
var client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
var BedrockService = /** @class */ (function () {
    function BedrockService(client, modelId, region) {
        this.client = null;
        if (client) {
            this.client = client;
        }
        this.customModelId = modelId;
        this.customRegion = region;
    }
    /**
     * Resolves and validates AWS Region from custom override or environment.
     * Throws an explicit error if missing.
     */
    BedrockService.prototype.getRegion = function () {
        var region = this.customRegion || process.env.AWS_REGION;
        if (!region) {
            throw new Error('Missing required AWS Region configuration. Please set the AWS_REGION environment variable.');
        }
        return region;
    };
    /**
     * Resolves and validates Bedrock Model ID from custom override or environment.
     * Throws an explicit error if missing.
     */
    BedrockService.prototype.getModelId = function () {
        var modelId = this.customModelId || process.env.BEDROCK_MODEL_ID;
        if (!modelId) {
            throw new Error('Missing required Bedrock Model ID configuration. Please set the BEDROCK_MODEL_ID environment variable.');
        }
        return modelId;
    };
    /**
     * Returns a reused BedrockRuntimeClient instance configured for the active region.
     * Avoids re-instantiating the SDK client on every request.
     */
    BedrockService.prototype.getClient = function () {
        if (!this.client) {
            var region = this.getRegion();
            this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: region });
        }
        return this.client;
    };
    /**
     * Invokes Amazon Bedrock Converse API with user prompt string or conversation history.
     * Uses ConverseCommand and validates output.
     */
    BedrockService.prototype.generateReply = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, modelId, region, client, bedrockMessages, maxTokens, command, response, responseText, error_1, err;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        messages = typeof input === 'string'
                            ? [{ role: 'user', content: input }]
                            : input;
                        if (!messages || messages.length === 0) {
                            throw new Error('Message input cannot be empty');
                        }
                        modelId = this.getModelId();
                        region = this.getRegion();
                        client = this.getClient();
                        bedrockMessages = messages.map(function (m) { return ({
                            role: m.role,
                            content: [{ text: m.content }],
                        }); });
                        // Log diagnostic metadata without logging full message contents or sensitive data
                        console.log("[BedrockService] Invoking model: ".concat(modelId, " (Region: ").concat(region, ", MessageCount: ").concat(messages.length, ")"));
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        maxTokens = parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10);
                        command = new client_bedrock_runtime_1.ConverseCommand({
                            modelId: modelId,
                            messages: bedrockMessages,
                            inferenceConfig: {
                                maxTokens: isNaN(maxTokens) ? 2048 : maxTokens,
                                temperature: 0.7,
                            },
                        });
                        return [4 /*yield*/, client.send(command)];
                    case 2:
                        response = _e.sent();
                        responseText = (_d = (_c = (_b = (_a = response.output) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.text;
                        if (!responseText || responseText.trim().length === 0) {
                            throw new Error('Bedrock returned an empty response content');
                        }
                        console.log("[BedrockService] Model invocation succeeded (ResponseLength: ".concat(responseText.length, " chars)"));
                        return [2 /*return*/, responseText];
                    case 3:
                        error_1 = _e.sent();
                        err = error_1;
                        // Log diagnostic details without leaking credentials or message text
                        console.error('[BedrockService] Model invocation failed:', {
                            name: err.name,
                            code: err.code,
                            message: err.message,
                            modelId: modelId,
                            region: region,
                        });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Alias for generateReply to maintain full backwards compatibility.
     */
    BedrockService.prototype.generateResponse = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generateReply(input)];
            });
        });
    };
    /**
     * Performs a safe diagnostic configuration check.
     * Does NOT make network calls or invoke the model.
     */
    BedrockService.prototype.checkConfiguration = function () {
        try {
            var region = this.getRegion();
            var modelId = this.getModelId();
            return { ok: true, region: region, modelId: modelId };
        }
        catch (err) {
            var message = err instanceof Error ? err.message : 'Invalid configuration';
            return { ok: false, error: message };
        }
    };
    /**
     * Performs an active, minimal model test invocation.
     * Warning: Incurs minimal AWS Bedrock token usage charges.
     */
    BedrockService.prototype.testInvocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, reply, latencyMs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, this.generateReply('ping')];
                    case 1:
                        reply = _a.sent();
                        latencyMs = Date.now() - startTime;
                        return [2 /*return*/, {
                                ok: true,
                                latencyMs: latencyMs,
                                modelId: this.getModelId(),
                                responseSnippet: reply.substring(0, 100),
                            }];
                }
            });
        });
    };
    return BedrockService;
}());
exports.BedrockService = BedrockService;
// Export default singleton instance
exports.bedrockService = new BedrockService();
/**
 * Reusable standalone function as required by specification:
 * generateReply(message: string): Promise<string>
 */
function generateReply(message) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.bedrockService.generateReply(message)];
        });
    });
}
