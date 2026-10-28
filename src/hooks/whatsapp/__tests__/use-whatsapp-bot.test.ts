import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCleanAvatarUrl } from '../use-whatsapp-bot';

describe('getCleanAvatarUrl', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  it('preserves valid direct HTTPS WhatsApp CDN URLs', () => {
    const cdnUrl = 'https://pps.whatsapp.net/v/t61.24694-24/431872121_123456_n.jpg';
    expect(getCleanAvatarUrl(cdnUrl)).toBe(cdnUrl);
  });

  it('returns null for empty or invalid values', () => {
    expect(getCleanAvatarUrl(null)).toBeNull();
    expect(getCleanAvatarUrl(undefined)).toBeNull();
    expect(getCleanAvatarUrl('')).toBeNull();
    expect(getCleanAvatarUrl('   ')).toBeNull();
  });

  describe('in HTTPS production environment (e.g. Vercel)', () => {
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

    it('normalizes relative /api/whatsapp URLs to absolute bot URLs so safe blob fetch can handle them', () => {
      expect(getCleanAvatarUrl('/api/whatsapp/chats/123@c.us/avatar.jpg')).toBe(
        'http://localhost:3001/api/whatsapp/chats/123@c.us/avatar.jpg'
      );
    });

    it('supports custom apiUrl when resolving relative paths', () => {
      expect(
        getCleanAvatarUrl('/api/whatsapp/chats/123@c.us/avatar.jpg', 'http://192.168.1.50:3001')
      ).toBe('http://192.168.1.50:3001/api/whatsapp/chats/123@c.us/avatar.jpg');
    });

    it('allows http:// bot URLs so useSafeMediaSrc can fetch them as blob', () => {
      expect(getCleanAvatarUrl('http://localhost:3001/api/whatsapp/chats/123/avatar.jpg')).toBe(
        'http://localhost:3001/api/whatsapp/chats/123/avatar.jpg'
      );
    });

    it('allows valid HTTPS URLs', () => {
      expect(getCleanAvatarUrl('https://pps.whatsapp.net/v/t61/avatar.jpg')).toBe(
        'https://pps.whatsapp.net/v/t61/avatar.jpg'
      );
    });
  });

  describe('in HTTP development environment (localhost)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          protocol: 'http:',
          origin: 'http://localhost:3000'
        },
        writable: true,
        configurable: true
      });
    });

    it('allows relative proxy URLs in local dev', () => {
      expect(getCleanAvatarUrl('/api/whatsapp/chats/123@c.us/avatar.jpg')).toBe(
        '/api/whatsapp/chats/123@c.us/avatar.jpg'
      );
    });
  });
});
