import "./config"; // Ensures dotenv is loaded before anything else
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat";
import { memoryRouter } from "./routes/memory";
import { config } from "./config";

export const app = express();

// Security & Parsing Middlewares
const allowedOrigin = config.frontendUrl;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, postman, server-to-server), matching origin, or local dev origins
      if (
        !origin ||
        origin === allowedOrigin ||
        allowedOrigin === "*" ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Request body size limit
app.use(express.json({ limit: "1mb" }));

// API Routes
app.use("/api", chatRouter);
app.use("/api", memoryRouter);

// Fallback 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[App] Uncaught middleware error:", err);
  res.status(500).json({ error: "Internal server error" });
});
