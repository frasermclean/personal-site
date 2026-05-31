export interface AppUser {
  name: string | null;
  email: string | null;
  avatarUrl: string;
  githubId: number;
  githubUsername: string;
  isOwner: boolean;
}

// auth messages
export enum AuthMessage {
  SignInSuccess = 'login-success',
  SignOutSuccess = 'logout-success',
  GitHubCallbackError = 'github-callback-error'
}
