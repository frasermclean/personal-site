const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export class TurnstileValidator {
  constructor(
    private readonly secretKey: string,
    private readonly timeout: number = 10000
  ) {}

  /**
   * Validate a Cloudflare Turnstile token via the siteverify API
   * @param token Turnstile token from client
   * @param remoteIp Client's IP address
   */
  public async validateToken(token: string, remoteIp?: string): Promise<void> {
    const formData = new FormData();
    formData.append('response', token);
    formData.append('secret', this.secretKey);

    if (remoteIp) {
      formData.append('remoteip', remoteIp);
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

/**
 * API response from Turnstile siteverify API
 */
interface SiteVerifyResponse {
  success: boolean;
  'error-codes': string[];
}

export class TurnstileError extends Error {
  constructor(
    message: string,
    public readonly context: { response?: Response; errorCodes?: string[] },
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'TurnstileError';
  }
}
