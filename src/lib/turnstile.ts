const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export class TurnstileValidator {
  constructor(
    private readonly secretKey: string,
    private readonly timeout: number = 10000
  ) {}

  /**
   * Validate a Cloudflare Turnstile token via the siteverify API
   * @param token Turnstile token from client
   * @param options Optional parameters for validation
   */
  public async validateToken(token: string, options: Partial<ValidateTokenOptions> = {}): Promise<void> {
    const formData = new FormData();
    formData.append('response', token);
    formData.append('secret', this.secretKey);

    if (options.remoteIp) {
      formData.append('remoteip', options.remoteIp);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new TurnstileError('Error calling Turnstile siteverify API', { response });
      }

      const result = await response.json<SiteVerifyResponse>();

      if (!result.success) {
        throw new TurnstileError('Turnstile validation failed', { response, errorCodes: result['error-codes'] });
      }

      if (options.expectedAction && result.action !== options.expectedAction) {
        throw new TurnstileError('Expected action does not match Turnstile response', { response });
      }

      if (options.expectedHostname && result.hostname !== options.expectedHostname) {
        throw new TurnstileError('Expected hostname does not match Turnstile response', { response });
      }

      const challengeTime = new Date(result.challenge_ts);
      const now = new Date();
      const ageMinutes = (now.getTime() - challengeTime.getTime()) / (1000 * 60);
      if (ageMinutes > 4) {
        console.warn(`Token is ${ageMinutes.toFixed(1)} minutes old`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TurnstileError('Turnstile validation request timed out', { errorCodes: ['timeout'] });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

interface ValidateTokenOptions {
  remoteIp: string;
  expectedAction: string;
  expectedHostname: string;
}

/**
 * API response from Turnstile siteverify API
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#api-response-format
 */
interface SiteVerifyResponse {
  success: boolean;
  challenge_ts: string;
  'error-codes': string[];
  hostname?: string;
  action?: string;
}

export class TurnstileError extends Error {
  constructor(
    message: string,
    public readonly context: { response?: Response; errorCodes?: string[] } = {},
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'TurnstileError';
  }
}
