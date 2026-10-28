import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isLoopbackUrl,
  isPrivateNetworkUrl,
  isLocalOrPrivateUrl,
  getTargetAddressSpace,
  getLocalNetworkFetchOptions,
  safeBotFetch
} from '../safe-fetch';

describe('safe-fetch', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
    vi.restoreAllMocks();
  });

  describe('isLoopbackUrl', () => {
    it('identifies localhost and subdomains', () => {
      expect(isLoopbackUrl('http://localhost:3001/api/whatsapp/status')).toBe(true);
      expect(isLoopbackUrl('https://localhost:3001/api/whatsapp/status')).toBe(true);
      expect(isLoopbackUrl('http://bot.localhost:3001/')).toBe(true);
    });

    it('identifies 127.0.0.1 and IPv6 loopback', () => {
      expect(isLoopbackUrl('http://127.0.0.1:3001/api/whatsapp/status')).toBe(true);
      expect(isLoopbackUrl('http://127.0.0.2:3001/')).toBe(true);
      expect(isLoopbackUrl('http://[::1]:3001/api')).toBe(true);
    });

    it('returns false for LAN IPs or external domains', () => {
      expect(isLoopbackUrl('http://192.168.1.50:3001/')).toBe(false);
      expect(isLoopbackUrl('https://minutas.vercel.app')).toBe(false);
      expect(isLoopbackUrl(null)).toBe(false);
    });
  });

  describe('isPrivateNetworkUrl', () => {
    it('identifies RFC 1918 and link-local LAN IPs', () => {
      expect(isPrivateNetworkUrl('http://192.168.1.50:3001/')).toBe(true);
      expect(isPrivateNetworkUrl('http://10.0.0.1:3001/')).toBe(true);
      expect(isPrivateNetworkUrl('http://172.16.0.1:3001/')).toBe(true);
      expect(isPrivateNetworkUrl('http://my-host.local:3001/')).toBe(true);
    });

    it('returns false for loopback or public URLs', () => {
      expect(isPrivateNetworkUrl('http://localhost:3001/')).toBe(false);
      expect(isPrivateNetworkUrl('http://127.0.0.1:3001/')).toBe(false);
      expect(isPrivateNetworkUrl('https://pps.whatsapp.net')).toBe(false);
    });
  });

  describe('isLocalOrPrivateUrl', () => {
    it('identifies loopback localhost and 127.0.0.1', () => {
      expect(isLocalOrPrivateUrl('http://localhost:3001/api/whatsapp/status')).toBe(true);
      expect(isLocalOrPrivateUrl('http://127.0.0.1:3001/api/whatsapp/status')).toBe(true);
      expect(isLocalOrPrivateUrl('https://localhost:3001/api/whatsapp/status')).toBe(true);
    });

    it('identifies private network IPs', () => {
      expect(isLocalOrPrivateUrl('http://192.168.1.50:3001/api/whatsapp/status')).toBe(true);
      expect(isLocalOrPrivateUrl('http://10.0.0.5:3001/api/whatsapp/status')).toBe(true);
      expect(isLocalOrPrivateUrl('http://172.16.0.1:3001/api/whatsapp/status')).toBe(true);
    });

    it('identifies relative URLs as local', () => {
      expect(isLocalOrPrivateUrl('/api/whatsapp/status')).toBe(true);
    });

    it('returns false for public URLs or invalid values', () => {
      expect(isLocalOrPrivateUrl('https://pps.whatsapp.net/v/t61/avatar.jpg')).toBe(false);
      expect(isLocalOrPrivateUrl('https://minutas-phi.vercel.app/api')).toBe(false);
      expect(isLocalOrPrivateUrl(null)).toBe(false);
      expect(isLocalOrPrivateUrl(undefined)).toBe(false);
      expect(isLocalOrPrivateUrl('')).toBe(false);
    });
  });

  describe('getTargetAddressSpace', () => {
    it('returns loopback for localhost and 127.0.0.1', () => {
      expect(getTargetAddressSpace('http://localhost:3001/api/whatsapp/status')).toBe('loopback');
      expect(getTargetAddressSpace('http://127.0.0.1:3001/api/whatsapp/status')).toBe('loopback');
    });

    it('returns local for private LAN IPs', () => {
      expect(getTargetAddressSpace('http://192.168.1.50:3001/api/whatsapp/status')).toBe('local');
      expect(getTargetAddressSpace('http://10.0.0.5:3001/api/whatsapp/status')).toBe('local');
    });

    it('returns undefined for relative or public URLs', () => {
      expect(getTargetAddressSpace('/api/whatsapp/status')).toBeUndefined();
      expect(getTargetAddressSpace('https://pps.whatsapp.net/v/avatar.jpg')).toBeUndefined();
    });
  });

  describe('getLocalNetworkFetchOptions', () => {
    it('attaches targetAddressSpace: "loopback" when running on HTTPS for localhost targets', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'https:',
          origin: 'https://minutas-phi.vercel.app'
        },
        writable: true,
        configurable: true
      });

      const options = getLocalNetworkFetchOptions('http://localhost:3001/api/whatsapp/status', {
        headers: { 'Content-Type': 'application/json' }
      });

      expect((options as any).targetAddressSpace).toBe('loopback');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('attaches targetAddressSpace: "local" when running on HTTPS for private LAN targets', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'https:',
          origin: 'https://minutas-phi.vercel.app'
        },
        writable: true,
        configurable: true
      });

      const options = getLocalNetworkFetchOptions('http://192.168.1.50:3001/api/whatsapp/status');
      expect((options as any).targetAddressSpace).toBe('local');
    });

    it('does not attach targetAddressSpace when running on HTTP localhost dev', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'http:',
          origin: 'http://localhost:5173'
        },
        writable: true,
        configurable: true
      });

      const options = getLocalNetworkFetchOptions('http://localhost:3001/api/whatsapp/status');
      expect((options as any).targetAddressSpace).toBeUndefined();
    });

    it('does not attach targetAddressSpace for public HTTPS URLs', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'https:',
          origin: 'https://minutas-phi.vercel.app'
        },
        writable: true,
        configurable: true
      });

      const options = getLocalNetworkFetchOptions('https://pps.whatsapp.net/v/avatar.jpg');
      expect((options as any).targetAddressSpace).toBeUndefined();
    });
  });

  describe('safeBotFetch', () => {
    it('calls fetch with loopback targetAddressSpace on HTTPS', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'https:',
          origin: 'https://minutas-phi.vercel.app'
        },
        writable: true,
        configurable: true
      });

      const mockResponse = new Response('ok', { status: 200 });
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal('fetch', fetchMock);

      const targetUrl = 'http://localhost:3001/api/whatsapp/status';
      const res = await safeBotFetch(targetUrl, { method: 'GET' });

      expect(res).toBe(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(targetUrl, expect.objectContaining({
        method: 'GET',
        targetAddressSpace: 'loopback'
      }));
    });

    it('retries with fallback address space if the primary space throws', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'https:',
          origin: 'https://minutas-phi.vercel.app'
        },
        writable: true,
        configurable: true
      });

      const mockResponse = new Response('ok-fallback', { status: 200 });
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new TypeError('Address space mismatch'))
        .mockResolvedValueOnce(mockResponse);
      vi.stubGlobal('fetch', fetchMock);

      const targetUrl = 'http://localhost:3001/api/whatsapp/status';
      const res = await safeBotFetch(targetUrl, { method: 'GET' });

      expect(res).toBe(mockResponse);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(1, targetUrl, expect.objectContaining({
        targetAddressSpace: 'loopback'
      }));
      expect(fetchMock).toHaveBeenNthCalledWith(2, targetUrl, expect.objectContaining({
        targetAddressSpace: 'local'
      }));
    });
  });
});
