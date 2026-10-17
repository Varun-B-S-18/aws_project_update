import { UserProfile } from '../types/memory';

const REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-2';
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

export const isCognitoConfigured = Boolean(USER_POOL_ID && CLIENT_ID);

interface CognitoAuthResult {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
}

/**
 * Parses JWT payload without external dependencies.
 */
function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

/**
 * Invokes AWS Cognito Identity Provider REST API using standard Fetch.
 */
async function callCognito<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!CLIENT_ID) {
    throw new Error('Amazon Cognito Client ID is not configured in VITE_COGNITO_CLIENT_ID.');
  }

  const response = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorType = data['__type'] || 'CognitoError';
    const message = data.message || data.Message || 'Amazon Cognito operation failed';
    const error = new Error(message);
    (error as Error & { code: string }).code = errorType;
    throw error;
  }

  return data as T;
}

export const cognitoService = {
  isConfigured(): boolean {
    return isCognitoConfigured;
  },

  /**
   * Registers a new user with Cognito.
   */
  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ userConfirmed: boolean; userSub: string }> {
    if (!isCognitoConfigured) {
      // Local dev mode fallback: deterministic dev ID
      const devSub = `dev-${btoa(email).replace(/=/g, '').substring(0, 16)}`;
      return { userConfirmed: true, userSub: devSub };
    }

    const result = await callCognito<{ UserConfirmed: boolean; UserSub: string }>('SignUp', {
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
      ],
    });

    return {
      userConfirmed: result.UserConfirmed,
      userSub: result.UserSub,
    };
  },

  /**
   * Confirms signup with verification code sent to user email.
   */
  async confirmSignUp(email: string, code: string): Promise<boolean> {
    if (!isCognitoConfigured) {
      return true;
    }

    await callCognito('ConfirmSignUp', {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    return true;
  },

  /**
   * Authenticates user using USER_PASSWORD_AUTH flow.
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: UserProfile; accessToken: string; idToken: string }> {
    if (!isCognitoConfigured) {
      // Local development sign-in fallback with encoded payload
      const userId = `dev-user-${btoa(email).replace(/=/g, '').substring(0, 12)}`;
      const name = email.split('@')[0];
      const devPayload = { userId, email, name };
      const devToken = `dev-token-${btoa(JSON.stringify(devPayload))}`;

      const profile: UserProfile = {
        userId,
        email,
        name,
        accessToken: devToken,
        idToken: devToken,
      };

      localStorage.setItem('auth_token', devToken);
      localStorage.setItem('auth_user', JSON.stringify(profile));

      return { user: profile, accessToken: devToken, idToken: devToken };
    }

    const result = await callCognito<{ AuthenticationResult: CognitoAuthResult }>('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const auth = result.AuthenticationResult;
    const claims = parseJwt(auth.IdToken || auth.AccessToken);
    const userId = (claims['sub'] as string) || (claims['cognito:username'] as string) || email;
    const name = (claims['name'] as string) || email.split('@')[0];

    const profile: UserProfile = {
      userId,
      email,
      name,
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
    };

    localStorage.setItem('auth_token', auth.AccessToken || auth.IdToken);
    localStorage.setItem('auth_id_token', auth.IdToken);
    if (auth.RefreshToken) {
      localStorage.setItem('auth_refresh_token', auth.RefreshToken);
    }
    localStorage.setItem('auth_user', JSON.stringify(profile));

    return {
      user: profile,
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
    };
  },

  /**
   * Triggers forgot password verification email.
   */
  async forgotPassword(email: string): Promise<boolean> {
    if (!isCognitoConfigured) {
      return true;
    }

    await callCognito('ForgotPassword', {
      ClientId: CLIENT_ID,
      Username: email,
    });

    return true;
  },

  /**
   * Confirms password reset with verification code and new password.
   */
  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    if (!isCognitoConfigured) {
      return true;
    }

    await callCognito('ConfirmForgotPassword', {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    return true;
  },

  /**
   * Restores existing session from storage if valid.
   */
  getStoredSession(): { user: UserProfile | null; token: string | null } {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      if (!token || !userStr) return { user: null, token: null };

      const user = JSON.parse(userStr) as UserProfile;
      return { user, token };
    } catch {
      return { user: null, token: null };
    }
  },

  /**
   * Signs out current user and clears local storage.
   */
  signOut(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_id_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  },
};

