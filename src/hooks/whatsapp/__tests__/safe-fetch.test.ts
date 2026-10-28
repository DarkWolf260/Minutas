import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isLocalOrPrivateUrl, getLocalNetworkFetchOptions, safeBotFetch } from '../safe-fetch';

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

  describe('getLocalNetworkFetchOptions', () => {
    it('attaches targetAddressSpace: "local" when running on HTTPS for local targets', () => {
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

      expect((options as any).targetAddressSpace).toBe('local');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
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
    it('calls fetch with enriched options on HTTPS', async () => {
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
        targetAddressSpace: 'local'
      }));
    });
  });
});
