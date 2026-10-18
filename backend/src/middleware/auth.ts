import { SimpleJwksCache } from "aws-jwt-verify/jwk";
import { CognitoIPv4Fetcher } from "../cognitoHttp";
import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { config } from "../config";
import "../types/auth";

// Cached Cognito verifier instance for performance
let cognitoVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getCognitoVerifier() {
  if (!cognitoVerifier && config.cognitoUserPoolId && config.cognitoClientId) {
    cognitoVerifier = CognitoJwtVerifier.create(
      {
        userPoolId: config.cognitoUserPoolId,
        clientId: config.cognitoClientId,
        tokenUse: "access",
      },
      {
        jwksCache: new SimpleJwksCache({
          fetcher: new CognitoIPv4Fetcher(),
        }),
      },
    );
  }

  return cognitoVerifier;
}

/**
 * Authentication middleware.
 *
 * Verifies Cognito access tokens and attaches the authenticated
 * user's identity to req.user.
 *
 * Development tokens are accepted only in development and test
 * environments, and only when Cognito is not configured.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  // 1. Validate the Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required. Missing or malformed Bearer token.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    res.status(401).json({
      error: "Authentication required. Bearer token is empty.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  // 2. Verify Cognito access tokens when Cognito is configured
  const verifier = getCognitoVerifier();

  if (verifier) {
    try {
      const payload = await verifier.verify(token);

      req.user = {
        // Cognito's unique user identifier
        userId: payload.sub,
        email:
          (payload.email as string | undefined) ||
          (payload["cognito:username"] as string | undefined) ||
          payload.sub,
        username:
          (payload["cognito:username"] as string | undefined) || payload.sub,
        name: (payload.name as string | undefined) || undefined,
      };

      return next();
    } catch (err: unknown) {
      console.warn(
        "[AuthMiddleware] Token verification failed:",
        err instanceof Error ? err.message : err,
      );

      res.status(401).json({
        error:
          "Invalid, malformed, or expired authentication token. Please log in again.",
        code: "TOKEN_INVALID",
      });
      return;
    }
  }

  // 3. Allow development tokens only when Cognito is not configured
  //    and the server is running in development or test mode.
  const isNonProduction =
    config.nodeEnv === "development" || config.nodeEnv === "test";

  const isDevelopmentToken =
    token.startsWith("test-token-") || token.startsWith("dev-token-");

  const cognitoIsNotConfigured =
    !config.cognitoUserPoolId || !config.cognitoClientId;

  if (isNonProduction && isDevelopmentToken && cognitoIsNotConfigured) {
    let devUserId = "test-user-1";
    let devEmail = "test@example.com";
    let devName = "Test User";

    // Handle test-token-<userId>
    if (token.startsWith("test-token-")) {
      const suffix = token.substring("test-token-".length);

      if (suffix) {
        devUserId = suffix;
        devEmail = `${suffix}@example.com`;
        devName = suffix;
      }
    }

    // Handle dev-token-<base64-encoded-user-payload>
    else if (token.startsWith("dev-token-")) {
      try {
        const encodedPayload = token.substring("dev-token-".length);

        const raw = Buffer.from(encodedPayload, "base64").toString("utf-8");

        const parsed: {
          userId?: string;
          email?: string;
          name?: string;
        } = JSON.parse(raw);

        if (parsed.userId) {
          devUserId = parsed.userId;
        }

        if (parsed.email) {
          devEmail = parsed.email;
        }

        if (parsed.name) {
          devName = parsed.name;
        }
      } catch {
        res.status(401).json({
          error: "Invalid development token.",
          code: "TOKEN_INVALID",
        });
        return;
      }
    }

    req.user = {
      userId: devUserId,
      email: devEmail,
      username: devUserId,
      name: devName,
    };

    return next();
  }

  // 4. Reject requests when authentication cannot be verified
  res.status(401).json({
    error:
      "Authentication could not be verified. Check Cognito configuration and log in again.",
    code: "AUTH_NOT_CONFIGURED",
  });
}
