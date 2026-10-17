import type { UserProfile } from "../types/memory";

const REGION = import.meta.env.VITE_AWS_REGION || "ap-southeast-2";
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";

export const isCognitoConfigured = Boolean(USER_POOL_ID && CLIENT_ID);

interface CognitoAuthResult {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
}

interface CognitoErrorResponse {
  __type?: string;
  message?: string;
  Message?: string;
}

function parseJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const bytes = atob(padded);
    const decoded = decodeURIComponent(
      Array.from(bytes)
        .map(
          (character) =>
            "%" + character.charCodeAt(0).toString(16).padStart(2, "0"),
        )
        .join(""),
    );

    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

async function callCognito<T>(
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isCognitoConfigured) {
    throw new Error(
      "Amazon Cognito is not configured. Check your frontend .env.",
    );
  }

  const response = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as CognitoErrorResponse;
    const error = new Error(
      errorData.message || errorData.Message || "Cognito request failed",
    ) as Error & { code?: string };

    error.code = errorData.__type;
    throw error;
  }

  return data as T;
}

function saveSession(user: UserProfile, auth: CognitoAuthResult): void {
  // Keep the application's existing session interface.
  // For production, prefer a more secure session design.
  localStorage.setItem("auth_token", auth.AccessToken);
  localStorage.setItem("auth_id_token", auth.IdToken);
  localStorage.setItem("auth_user", JSON.stringify(user));

  if (auth.RefreshToken) {
    localStorage.setItem("auth_refresh_token", auth.RefreshToken);
  }
}

export const cognitoService = {
  isConfigured(): boolean {
    return isCognitoConfigured;
  },

  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<{ userConfirmed: boolean; userSub: string }> {
    const result = await callCognito<{
      UserConfirmed: boolean;
      UserSub: string;
    }>("SignUp", {
      ClientId: CLIENT_ID,
      Username: email.trim(),
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email.trim() },
        { Name: "name", Value: name.trim() },
      ],
    });

    return {
      userConfirmed: result.UserConfirmed,
      userSub: result.UserSub,
    };
  },

  async confirmSignUp(email: string, code: string): Promise<boolean> {
    await callCognito("ConfirmSignUp", {
      ClientId: CLIENT_ID,
      Username: email.trim(),
      ConfirmationCode: code.trim(),
    });

    return true;
  },

  async signIn(
    email: string,
    password: string,
  ): Promise<{
    user: UserProfile;
    accessToken: string;
    idToken: string;
  }> {
    const result = await callCognito<{
      AuthenticationResult?: CognitoAuthResult;
      ChallengeName?: string;
      Session?: string;
    }>("InitiateAuth", {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email.trim(),
        PASSWORD: password,
      },
    });

    if (!result.AuthenticationResult) {
      throw new Error(
        `Cognito requires an additional authentication step${
          result.ChallengeName ? `: ${result.ChallengeName}` : ""
        }. This flow must be handled before login can finish.`,
      );
    }

    const auth = result.AuthenticationResult;

    if (!auth.AccessToken || !auth.IdToken) {
      throw new Error(
        "Cognito did not return the required authentication tokens.",
      );
    }

    // Decode claims for UI display only. The backend must verify JWT signatures.
    const claims = parseJwt(auth.IdToken);

    const userId = String(claims.sub || "");
    if (!userId) {
      throw new Error(
        "The Cognito ID token does not contain a user identifier.",
      );
    }

    const user: UserProfile = {
      userId,
      email: String(claims.email || email),
      name: String(claims.name || email.split("@")[0]),
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
    };

    saveSession(user, auth);

    return {
      user,
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
    };
  },

  async forgotPassword(email: string): Promise<boolean> {
    await callCognito("ForgotPassword", {
      ClientId: CLIENT_ID,
      Username: email.trim(),
    });

    return true;
  },

  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<boolean> {
    await callCognito("ConfirmForgotPassword", {
      ClientId: CLIENT_ID,
      Username: email.trim(),
      ConfirmationCode: code.trim(),
      Password: newPassword,
    });

    return true;
  },

  getStoredSession(): {
    user: UserProfile | null;
    token: string | null;
  } {
    try {
      const token = localStorage.getItem("auth_token");
      const userString = localStorage.getItem("auth_user");

      if (!token || !userString) {
        return { user: null, token: null };
      }

      return {
        user: JSON.parse(userString) as UserProfile,
        token,
      };
    } catch {
      return { user: null, token: null };
    }
  },

  signOut(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_id_token");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_user");
  },
};
