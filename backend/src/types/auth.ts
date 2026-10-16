export interface AuthenticatedUser {
  userId: string;
  email?: string;
  username?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

