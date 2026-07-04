import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TurnstileError, TurnstileValidator } from './turnstile';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

describe('TurnstileValidator', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('resolves when the siteverify API reports success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true, 'error-codes': [] })));

    const validator = new TurnstileValidator('secret-key');

    await expect(validator.validateToken('token')).resolves.toBeUndefined();
  });

  it('sends the token, secret and remote IP to the siteverify API', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true, 'error-codes': [] })));

    const validator = new TurnstileValidator('secret-key');
    await validator.validateToken('token', '203.0.113.1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe('POST');

    const formData = init?.body as FormData;
    expect(formData.get('response')).toBe('token');
    expect(formData.get('secret')).toBe('secret-key');
    expect(formData.get('remoteip')).toBe('203.0.113.1');
  });

  it('omits the remote IP field when not provided', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true, 'error-codes': [] })));

    const validator = new TurnstileValidator('secret-key');
    await validator.validateToken('token');

    const [, init] = fetchMock.mock.calls[0];
    const formData = init?.body as FormData;
    expect(formData.has('remoteip')).toBe(false);
  });

  it('throws a TurnstileError when the siteverify API responds with a non-OK status', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500, statusText: 'Internal Server Error' }));

    const validator = new TurnstileValidator('secret-key');

    await expect(validator.validateToken('token')).rejects.toThrow(TurnstileError);
  });

  it('throws a TurnstileError with the reported error codes when validation fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }))
    );

    const validator = new TurnstileValidator('secret-key');

    await expect(validator.validateToken('token')).rejects.toMatchObject({
      context: { errorCodes: ['invalid-input-response'] }
    });
  });

  it('throws a TurnstileError when the request times out', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

    const validator = new TurnstileValidator('secret-key');

    const result = validator.validateToken('token');
    await expect(result).rejects.toBeInstanceOf(TurnstileError);
    await expect(result).rejects.toMatchObject({ context: { errorCodes: ['timeout'] } });
  });

  it('rethrows unrecognized fetch failures unchanged', async () => {
    const networkError = new TypeError('fetch failed');
    fetchMock.mockRejectedValue(networkError);

    const validator = new TurnstileValidator('secret-key');

    await expect(validator.validateToken('token')).rejects.toBe(networkError);
  });
});
