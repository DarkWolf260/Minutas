/**
 * Detects if a URL targets a local loopback or private network address
 * (e.g. localhost, 127.0.0.1, private IPs, or relative paths).
 */
export function isLocalOrPrivateUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i.test(trimmed);
}

/**
 * Returns RequestInit options enriched with targetAddressSpace
 * for Chrome's Local Network Access / Private Network Access restrictions.
 * In HTTPS environments (like Vercel), Chrome blocks requests to localhost/private IPs
 * unless targetAddressSpace is explicitly declared as 'local' or 'private'.
 */
export function getLocalNetworkFetchOptions(url: string, options: RequestInit = {}): RequestInit {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (isHttps && isLocalOrPrivateUrl(url)) {
    return {
      ...options,
      // @ts-expect-error targetAddressSpace is part of the W3C Local Network Access specification
      targetAddressSpace: 'local'
    };
  }

  return options;
}

/**
 * Executes a fetch request with Local Network Access (LNA) targetAddressSpace
 * support for Chrome.
 */
export async function safeBotFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const enrichedOptions = getLocalNetworkFetchOptions(url, options);
  return fetch(url, enrichedOptions);
}
