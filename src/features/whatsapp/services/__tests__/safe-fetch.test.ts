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

    it('returns false for localhost or public IPs', () => {
      expect(isPrivateNetworkUrl('http://localhost:3001')).toBe(false);
      expect(isPrivateNetworkUrl('http://8.8.8.8:3001')).toBe(false);
      expect(isPrivateNetworkUrl(null)).toBe(false);
    });
  });

  describe('isLocalOrPrivateUrl', () => {
    it('returns true for relative paths and local addresses', () => {
      expect(isLocalOrPrivateUrl('/api/whatsapp')).toBe(true);
      expect(isLocalOrPrivateUrl('http://localhost:3001')).toBe(true);
      expect(isLocalOrPrivateUrl('http://192.168.1.10:3001')).toBe(true);
      expect(isLocalOrPrivateUrl('https://google.com')).toBe(false);
    });
  });

  describe('getTargetAddressSpace', () => {
    it('returns loopback for localhost and 127.0.0.1', () => {
      expect(getTargetAddressSpace('http://localhost:3001/api')).toBe('loopback');
      expect(getTargetAddressSpace('http://127.0.0.1:3001')).toBe('loopback');
    });

    it('returns local for private network IPs', () => {
      expect(getTargetAddressSpace('http://192.168.1.100:3001')).toBe('local');
      expect(getTargetAddressSpace('http://10.0.0.5:3001')).toBe('local');
    });

    it('returns undefined for public or relative URLs', () => {
      expect(getTargetAddressSpace('https://example.com/api')).toBeUndefined();
      expect(getTargetAddressSpace('/api/whatsapp/chats')).toBeUndefined();
    });
  });

  describe('getLocalNetworkFetchOptions', () => {
    it('does not add targetAddressSpace when not HTTPS', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:' },
        writable: true,
        configurable: true
      });

      const options = getLocalNetworkFetchOptions('http://localhost:3001');
      expect((options as any).targetAddressSpace).toBeUndefined();
    });

    it('adds targetAddressSpace when running on HTTPS', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:' },
        writable: true,
        configurable: true
      });

      const options = getLocalNetworkFetchOptions('http://localhost:3001');
      expect((options as any).targetAddressSpace).toBe('loopback');

      const lanOptions = getLocalNetworkFetchOptions('http://192.168.1.20:3001');
      expect((lanOptions as any).targetAddressSpace).toBe('local');
    });
  });

  describe('safeBotFetch', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:' },
        writable: true,
        configurable: true
      });
    });

    it('attempts fetch with initial targetAddressSpace', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      const res = await safeBotFetch('http://localhost:3001/status');
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3001/status',
        expect.objectContaining({ targetAddressSpace: 'loopback' })
      );
      expect(res).toBe(mockResponse);
    });

    it('falls back to alternate address space if primary fails', async () => {
      const mockSuccessResponse = new Response('ok', { status: 200 });
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new TypeError('Failed fetch targetAddressSpace loopback'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const res = await safeBotFetch('http://localhost:3001/status');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3001/status',
        expect.objectContaining({ targetAddressSpace: 'local' })
      );
      expect(res).toBe(mockSuccessResponse);
    });

    it('falls back to bare fetch if both address spaces fail', async () => {
      const mockSuccessResponse = new Response('ok', { status: 200 });
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new TypeError('Failed loopback'))
        .mockRejectedValueOnce(new TypeError('Failed local'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const res = await safeBotFetch('http://localhost:3001/status');
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(fetchSpy).toHaveBeenNthCalledWith(3, 'http://localhost:3001/status', {});
      expect(res).toBe(mockSuccessResponse);
    });

    it('re-throws original error if all attempts fail', async () => {
      const originalErr = new TypeError('Failed loopback');
      vi.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(originalErr)
        .mockRejectedValueOnce(new TypeError('Failed local'))
        .mockRejectedValueOnce(new TypeError('Failed plain'));

      await expect(safeBotFetch('http://localhost:3001/status')).rejects.toThrow('Failed loopback');
    });
  });
});

