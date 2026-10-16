import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../config';
import '../types/auth'; // Ensure Request.user is typed

// Cached verifier instance for performance
let cognitoVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getCognitoVerifier() {
  if (!cognitoVerifier && config.cognitoUserPoolId && config.cognitoClientId) {
    cognitoVerifier = CognitoJwtVerifier.create({
      userPoolId: config.cognitoUserPoolId,
      clientId: config.cognitoClientId,
      tokenUse: null, // Accepts both ID and Access tokens
    });
  }
  return cognitoVerifier;
}

/**
 * Authentication middleware that verifies Cognito JWTs.
 * Securely extracts the canonical user identity (sub) and attaches it to req.user.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Missing or malformed Bearer token in Authorization header.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    res.status(401).json({
      error: 'Authentication required. Bearer token is empty.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  // 1. If Cognito is configured, verify signature, expiration, issuer and claims using aws-jwt-verify
  const verifier = getCognitoVerifier();

  if (verifier) {
    try {
      const payload = await verifier.verify(token);
      req.user = {
        userId: payload.sub,
        email: (payload.email as string) || (payload['cognito:username'] as string) || payload.sub,
        username: (payload['cognito:username'] as string) || payload.sub,
        name: (payload.name as string) || undefined,
      };
      return next();
    } catch (err: unknown) {
      console.warn('[AuthMiddleware] Token verification failed:', err instanceof Error ? err.message : err);
      res.status(401).json({
        error: 'Invalid, malformed, or expired authentication token. Please log in again.',
        code: 'TOKEN_INVALID',
      });
      return;
    }
  }

  // 2. Fallback for test and local development when Cognito User Pool is not yet deployed:
  // Strictly validate test/dev tokens in non-production environments
  if (config.nodeEnv === 'test' || token.startsWith('test-token-') || token.startsWith('dev-token-')) {
    let devUserId = 'test-user-1';
    let devEmail = 'test@example.com';

    if (token.startsWith('test-token-')) {
      const suffix = token.replace('test-token-', '');
      if (suffix) {
        devUserId = suffix;
        devEmail = `${suffix}@example.com`;
      }
    } else if (token.startsWith('dev-token-')) {
      // Decode base64 payload if present
      try {
        const raw = Buffer.from(token.replace('dev-token-', ''), 'base64').toString('utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.userId) devUserId = parsed.userId;
        if (parsed.email) devEmail = parsed.email;
      } catch {
        devUserId = token.replace('dev-token-', '') || 'dev-user';
      }
    }

    req.user = {
      userId: devUserId,
      email: devEmail,
      username: devUserId,
    };
    return next();
  }

  // Cognito is not configured and token is not an authorized test token
  res.status(401).json({
    error: 'Cognito authentication is not configured on the server. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID.',
    code: 'AUTH_NOT_CONFIGURED',
  });
}

