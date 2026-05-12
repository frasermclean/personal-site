export interface UserSession {
  id: string;
  githubId: number;
  githubUsername: string;
  name: string | null;
  avatarUrl: string;
  email: string | null;
  createdAt: number;
  expiresAt: number;
}

// auth messages
export enum AuthMessage {
  LoginSuccess = 'login-success',
  LogoutSuccess = 'logout-success',
  GitHubLoginError = 'github-login-error',
  GitHubParamsError = 'github-params-error',
  GitHubCallbackError = 'github-callback-error'
}
