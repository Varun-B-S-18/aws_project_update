"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("./config"); // Ensures dotenv is loaded before anything else
var express_1 = require("express");
var cors_1 = require("cors");
var chat_1 = require("./routes/chat");
var config_1 = require("./config");
exports.app = (0, express_1.default)();
// Security & Parsing Middlewares
var allowedOrigin = config_1.config.frontendUrl;
exports.app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
        if (!origin || origin === allowedOrigin || allowedOrigin === '*') {
            callback(null, true);
        }
        else {
            // Fallback for local development
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));
// Request body size limit
exports.app.use(express_1.default.json({ limit: '1mb' }));
// API Routes
exports.app.use('/api', chat_1.chatRouter);
// Fallback 404 handler
exports.app.use(function (_req, res) {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
exports.app.use(function (err, _req, res, _next) {
    console.error('[App] Uncaught middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
