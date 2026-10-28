import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resolveSafeMediaUrl,
  isNeedsSafeFetch,
  clearMediaBlobCache,
  getMediaBlobCacheSize
} from '../use-whatsapp-media';

describe('use-whatsapp-media', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    clearMediaBlobCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearMediaBlobCache();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  describe('isNeedsSafeFetch', () => {
    it('returns false for empty or non-string inputs', () => {
      expect(isNeedsSafeFetch(null)).toBe(false);
      expect(isNeedsSafeFetch(undefined)).toBe(false);
      expect(isNeedsSafeFetch('')).toBe(false);
    });

    it('returns false for data: and blob: URLs in any environment', () => {
      expect(isNeedsSafeFetch('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(false);
      expect(isNeedsSafeFetch('blob:https://minutas-phi.vercel.app/test-uuid')).toBe(false);
    });

    describe('when running on HTTPS (production / Vercel)', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'location', {
          value: {
            ...originalLocation,
            protocol: 'https:',
            origin: 'https://minutas-phi.vercel.app'
          },
          writable: true,
          configurable: true
        });
      });

      it('detects insecure http:// URLs as needing safe fetch to prevent Mixed Content', () => {
        expect(isNeedsSafeFetch('http://localhost:3001/api/whatsapp/messages/123/media')).toBe(true);
        expect(isNeedsSafeFetch('http://127.0.0.1:3001/api/whatsapp/messages/123/media')).toBe(true);
        expect(isNeedsSafeFetch('http://192.168.1.50:3001/api/whatsapp/messages/123/media')).toBe(true);
      });

      it('detects relative URLs as needing safe fetch', () => {
        expect(isNeedsSafeFetch('/api/whatsapp/messages/123/media')).toBe(true);
      });

      it('permits secure https:// URLs without conversion', () => {
        expect(isNeedsSafeFetch('https://pps.whatsapp.net/v/t61.24694-24/avatar.jpg')).toBe(false);
      });
    });

    describe('when running on HTTP (local development)', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'location', {
          value: {
            ...originalLocation,
            protocol: 'http:',
            origin: 'http://localhost:5173'
          },
          writable: true,
          configurable: true
        });
      });

      it('does not force safe fetch for http:// URLs', () => {
        expect(isNeedsSafeFetch('http://localhost:3001/api/whatsapp/messages/123/media')).toBe(false);
      });
    });
  });

  describe('resolveSafeMediaUrl', () => {
    it('returns null for empty inputs', async () => {
      expect(await resolveSafeMediaUrl(null)).toBeNull();
      expect(await resolveSafeMediaUrl(undefined)).toBeNull();
      expect(await resolveSafeMediaUrl('')).toBeNull();
    });

    it('returns data: and blob: URLs unchanged immediately', async () => {
      const dataUri = 'data:image/jpeg;base64,/9j/test';
      const blobUrl = 'blob:https://domain/test-uuid';
      expect(await resolveSafeMediaUrl(dataUri)).toBe(dataUri);
      expect(await resolveSafeMediaUrl(blobUrl)).toBe(blobUrl);
    });

    describe('on HTTPS page', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'location', {
          value: {
            ...originalLocation,
            protocol: 'https:',
            origin: 'https://minutas-phi.vercel.app'
          },
          writable: true,
          configurable: true
        });
      });

      it('fetches insecure http:// media and converts it to a blob: URL', async () => {
        const mockBlob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
        const createObjectURLMock = vi.fn().mockReturnValue('blob:https://minutas-phi.vercel.app/safe-image-123');
        vi.stubGlobal('URL', {
          ...URL,
          createObjectURL: createObjectURLMock,
          revokeObjectURL: vi.fn()
        });

        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          blob: async () => mockBlob
        });
        vi.stubGlobal('fetch', fetchMock);

        const targetUrl = 'http://localhost:3001/api/whatsapp/messages/test_123/media';
        const result = await resolveSafeMediaUrl(targetUrl);

        expect(fetchMock).toHaveBeenCalledWith(
          targetUrl,
          expect.objectContaining({ targetAddressSpace: 'local' })
        );
        expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob);
        expect(result).toBe('blob:https://minutas-phi.vercel.app/safe-image-123');
        expect(getMediaBlobCacheSize()).toBe(1);

        // Subsequent call returns cached blob URL without re-fetching
        const cachedResult = await resolveSafeMediaUrl(targetUrl);
        expect(cachedResult).toBe('blob:https://minutas-phi.vercel.app/safe-image-123');
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });

      it('handles fetch failures gracefully without throwing and returns null', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
        vi.stubGlobal('fetch', fetchMock);

        const targetUrl = 'http://localhost:3001/api/whatsapp/messages/failed_123/media';
        const result = await resolveSafeMediaUrl(targetUrl);
        expect(result).toBeNull();
      });

      it('handles HTTP error status codes gracefully and returns null', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
          ok: false,
          status: 404
        });
        vi.stubGlobal('fetch', fetchMock);

        const targetUrl = 'http://localhost:3001/api/whatsapp/messages/not_found_123/media';
        const result = await resolveSafeMediaUrl(targetUrl);
        expect(result).toBeNull();
      });
    });
  });
});
