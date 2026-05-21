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
  LoginSuccess = 'login-success',
  LogoutSuccess = 'logout-success',
  GitHubLoginError = 'github-login-error',
  GitHubParamsError = 'github-params-error',
  GitHubCallbackError = 'github-callback-error'
}
