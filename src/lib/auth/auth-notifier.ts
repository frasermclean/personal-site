import { toast } from '@/components/starwind/toast';
import { AuthMessage } from './auth-types';

function isAuthMessage(message: string): message is AuthMessage {
  return Object.values(AuthMessage).includes(message as AuthMessage);
}

function parseAuthMessage(message: AuthMessage): { status: 'success' | 'error'; text: string } {
  switch (message) {
    case AuthMessage.SignInSuccess:
      return { status: 'success', text: 'Signed in successfully' };
    case AuthMessage.SignOutSuccess:
      return { status: 'success', text: 'Signed out successfully' };
    case AuthMessage.GitHubCallbackError:
      return { status: 'error', text: 'GitHub authentication failed.' };
    default:
      return { status: 'error', text: 'Unhandled error occurred' };
  }
}

const message = new URLSearchParams(window.location.search).get('auth');

if (message && isAuthMessage(message)) {
  // show toast
  const { status, text } = parseAuthMessage(message);
  if (text) {
    if (status === 'success') {
      toast.success(text);
    } else {
      toast.error(text);
    }
  }

  // track login/logout events with Umami
  if (message === AuthMessage.SignInSuccess) {
    umami.track('user-login');
  } else if (message === AuthMessage.SignOutSuccess) {
    umami.track('user-logout');
  }
}

// clear the auth param from the URL so the toast doesn't show on page refresh
const url = new URL(window.location.href);
url.searchParams.delete('auth');
window.history.replaceState({}, '', url);
