import { describe, it, expect } from 'vitest';
import { groupMessagesIntoAlbums } from '../whatsapp-chat-view';
import type { WhatsAppMessage } from '../../types';

describe('groupMessagesIntoAlbums', () => {
  const baseMessage = (overrides: Partial<WhatsAppMessage>): WhatsAppMessage => ({
    id: 'msg-1',
    body: '',
    type: 'image',
    timestamp: 1000000,
    fromMe: false,
    from: '584121234567@c.us',
    to: 'me@c.us',
    author: '584121234567@c.us',
    senderName: 'Jesús Barrero',
    hasMedia: true,
    mediaUrl: '/api/whatsapp/messages/msg-1/media',
    thumbnail: 'data:image/jpeg;base64,123',
    ...overrides
  });

  it('keeps single image messages as single messages', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'txt-1', type: 'chat', body: 'Hola', hasMedia: false, timestamp: 1002000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0].type).toBe('image');
    expect(result[0].albumMessages).toBeUndefined();
    expect(result[1].type).toBe('chat');
  });

  it('groups 3 consecutive image messages and an album stub into a single album', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', timestamp: 1000000 }),
      baseMessage({ id: 'img-3', timestamp: 1000000 }),
      baseMessage({ id: 'album-stub', type: 'album', hasMedia: false, timestamp: 1000000 }),
      baseMessage({
        id: 'reply-1',
        type: 'chat',
        body: 'Capacitación...',
        hasMedia: false,
        timestamp: 1030000,
        hasQuotedMsg: true,
        quotedMsg: {
          id: 'album-stub',
          type: 'album',
          senderName: 'Jesús Barrero'
        }
      })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);

    // First item is the album
    const album = result[0];
    expect(album.type).toBe('album');
    expect(album.id).toBe('album-stub'); // absorbed the stub ID
    expect(album.albumMessages?.length).toBe(3);
    expect(album.albumMessages?.map(m => m.id)).toEqual(['img-1', 'img-2', 'img-3']);

    // Second item is the reply
    expect(result[1].id).toBe('reply-1');
  });

  it('groups consecutive image messages without an album stub', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', timestamp: 1005000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('album');
    expect(result[0].albumMessages?.length).toBe(2);
  });

  it('does not group image messages from different senders', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', author: 'user-a', from: 'user-a', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', author: 'user-b', from: 'user-b', timestamp: 1000000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('img-1');
    expect(result[1].id).toBe('img-2');
  });

  it('does not group image messages with more than 60 seconds interval', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', timestamp: 1070000 }) // 70 seconds later
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0].type).toBe('image');
    expect(result[1].type).toBe('image');
  });
});

