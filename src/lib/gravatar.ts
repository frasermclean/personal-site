export async function getGravatarUrl(email: string, size: number = 80): Promise<string> {
  const hash = await sha256Hex(email);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

async function sha256Hex(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
