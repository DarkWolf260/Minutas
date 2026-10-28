function getHostname(url: string): string {
  try {
    const parsed = new URL(url, 'http://dummy.base');
    return parsed.hostname.toLowerCase();
  } catch {
    const match = url.match(/^https?:\/\/([^/:]+)/i);
    return match?.[1]?.toLowerCase() ?? '';
  }
}

/**
 * Detects if a URL targets a loopback address:
 * - localhost or *.localhost
 * - 127.0.0.0/8 (e.g. 127.0.0.1)
 * - ::1 or [::1] (IPv6 loopback)
 */
export function isLoopbackUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const hostname = getHostname(url.trim());
  if (!hostname || hostname === 'dummy.base') return false;

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return true;
  if (/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/.test(hostname)) return true;
  if (hostname === '::1' || hostname === '[::1]') return true;

  return false;
}

/**
 * Detects if a URL targets a private or local network address (RFC 1918, RFC 3927, mDNS):
 * - 10.0.0.0/8
 * - 172.16.0.0/12
 * - 192.168.0.0/16
 * - 169.254.0.0/16 (link-local)
 * - *.local
 */
export function isPrivateNetworkUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const hostname = getHostname(url.trim());
  if (!hostname || hostname === 'dummy.base') return false;

  if (hostname === 'local' || hostname.endsWith('.local')) return true;
  if (/^10(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/.test(hostname)) return true;
  if (/^172\.(?:1[6-9]|2\d|3[01])(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){2}$/.test(hostname)) return true;
  if (/^192\.168(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){2}$/.test(hostname)) return true;
  if (/^169\.254(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){2}$/.test(hostname)) return true;

  return false;
}

/**
 * Detects if a URL targets a local loopback or private network address
 * (e.g. localhost, 127.0.0.1, private IPs, or relative paths).
 */
export function isLocalOrPrivateUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return true;
  return isLoopbackUrl(trimmed) || isPrivateNetworkUrl(trimmed);
}

/**
 * Returns the exact targetAddressSpace required by Chrome's Local Network Access /
 * Private Network Access specification.
 * - 'loopback' for localhost, 127.0.0.1, ::1
 * - 'local' for private LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x, *.local)
 * - undefined for public or relative URLs
 */
export function getTargetAddressSpace(url: string): 'loopback' | 'local' | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return undefined;
  if (isLoopbackUrl(trimmed)) return 'loopback';
  if (isPrivateNetworkUrl(trimmed)) return 'local';
  return undefined;
}

/**
 * Returns RequestInit options enriched with targetAddressSpace
 * for Chrome's Local Network Access / Private Network Access restrictions.
 * In HTTPS environments (like Vercel), Chrome blocks requests to localhost/private IPs
 * unless targetAddressSpace matches the destination address space exactly.
 */
export function getLocalNetworkFetchOptions(url: string, options: RequestInit = {}): RequestInit {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (isHttps) {
    const targetAddressSpace = getTargetAddressSpace(url);
    if (targetAddressSpace) {
      return {
        ...options,
        // @ts-expect-error targetAddressSpace is part of the W3C Local Network Access specification
        targetAddressSpace
      };
    }
  }

  return options;
}

/**
 * Executes a fetch request with Local Network Access (LNA) targetAddressSpace
 * support for Chrome, with automatic fallback handling across address spaces.
 */
export async function safeBotFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const enrichedOptions = getLocalNetworkFetchOptions(url, options);

  if ((enrichedOptions as any).targetAddressSpace) {
    try {
      return await fetch(url, enrichedOptions);
    } catch (primaryErr) {
      const currentSpace = (enrichedOptions as any).targetAddressSpace;
      const fallbackSpace = currentSpace === 'loopback' ? 'local' : 'loopback';

      try {
        const fallbackOptions = {
          ...options,
          targetAddressSpace: fallbackSpace
        };
        return await fetch(url, fallbackOptions as RequestInit);
      } catch {
        try {
          return await fetch(url, options);
        } catch {
          throw primaryErr;
        }
      }
    }
  }

  return fetch(url, enrichedOptions);
}
