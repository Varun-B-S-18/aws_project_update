export interface Memory {
  userId: string;
  recordId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  category?: 'preference' | 'project' | 'identity' | 'education' | 'general' | string;
}

export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  idToken?: string;
  accessToken?: string;
}

