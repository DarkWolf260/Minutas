import { describe, it, expect } from 'vitest';
import { groupMessagesIntoAlbums } from '../whatsapp-chat-view';
import type { WhatsAppMessage } from '../../types';

describe('groupMessagesIntoAlbums', () => {
  const baseMessage = (overrides: Partial<WhatsAppMessage>): WhatsAppMessage => {
    const id = overrides.id || 'msg-1';
    return {
      id,
      body: '',
      type: 'image',
      timestamp: 1000000,
      fromMe: false,
      from: '584121234567@c.us',
      to: 'me@c.us',
      author: '584121234567@c.us',
      senderName: 'Jesús Barrero',
      hasMedia: true,
      mediaUrl: `/api/whatsapp/messages/${id}/media`,
      thumbnail: `data:image/jpeg;base64,thumb-${id}`,
      ...overrides
    };
  };

  it('keeps single image messages as single messages', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'txt-1', type: 'chat', body: 'Hola', hasMedia: false, timestamp: 1002000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0]!.type).toBe('image');
    expect(result[0]!.albumMessages).toBeUndefined();
    expect(result[1]!.type).toBe('chat');
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
    const album = result[0]!;
    expect(album.type).toBe('album');
    expect(album.id).toBe('album-stub'); // absorbed the stub ID
    expect(album.albumMessages?.length).toBe(3);
    expect(album.albumMessages?.map(m => m.id)).toEqual(['img-1', 'img-2', 'img-3']);

    // Second item is the reply
    expect(result[1]!.id).toBe('reply-1');
  });

  it('groups consecutive image messages without an album stub', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', timestamp: 1005000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(1);
    expect(result[0]!.type).toBe('album');
    expect(result[0]!.albumMessages?.length).toBe(2);
  });

  it('does not group image messages from different senders', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', author: 'user-a', from: 'user-a', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', author: 'user-b', from: 'user-b', timestamp: 1000000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0]!.id).toBe('img-1');
    expect(result[1]!.id).toBe('img-2');
  });

  it('does not group image messages with more than 5 seconds interval', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', timestamp: 1010000 }) // 10 seconds later
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0]!.type).toBe('image');
    expect(result[1]!.type).toBe('image');
  });

  it('does not group images when a text message is in between', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'txt-1', type: 'chat', body: 'Mensaje de texto en medio', hasMedia: false, timestamp: 1001000 }),
      baseMessage({ id: 'img-2', timestamp: 1002000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(3);
    expect(result[0]!.type).toBe('image');
    expect(result[0]!.id).toBe('img-1');
    expect(result[1]!.type).toBe('chat');
    expect(result[1]!.id).toBe('txt-1');
    expect(result[2]!.type).toBe('image');
    expect(result[2]!.id).toBe('img-2');
  });

  it('does not create duplicate images inside an album', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', mediaUrl: '/media/1', timestamp: 1000000 }),
      baseMessage({ id: 'img-1-dup', mediaUrl: '/media/1', timestamp: 1000500 }),
      baseMessage({ id: 'img-2', mediaUrl: '/media/2', timestamp: 1001000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(1);
    expect(result[0]!.type).toBe('album');
    expect(result[0]!.albumMessages?.length).toBe(2);
    expect(result[0]!.albumMessages?.map(m => m.id)).toEqual(['img-1', 'img-2']);
  });

  it('does not group images if multiple images have distinct captions', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', body: 'Foto 1 con su propio reporte', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', body: 'Foto 2 con otro reporte distinto', timestamp: 1001000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    expect(result[0]!.type).toBe('image');
    expect(result[0]!.id).toBe('img-1');
    expect(result[0]!.body).toBe('Foto 1 con su propio reporte');
    expect(result[1]!.type).toBe('image');
    expect(result[1]!.id).toBe('img-2');
    expect(result[1]!.body).toBe('Foto 2 con otro reporte distinto');
  });

  it('groups images when only one image in the burst has a caption', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', body: 'Capacitación brigadistas', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', timestamp: 1001000 }),
      baseMessage({ id: 'img-3', timestamp: 1002000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(1);
    expect(result[0]!.type).toBe('album');
    expect(result[0]!.body).toBe('Capacitación brigadistas');
    expect(result[0]!.albumMessages?.length).toBe(3);
  });

  it('breaks the album when a second caption is encountered', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'img-2', body: 'Reporte A', timestamp: 1001000 }),
      baseMessage({ id: 'img-3', body: 'Reporte B', timestamp: 1002000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(2);
    // img-1 and img-2 form an album with Reporte A
    expect(result[0]!.type).toBe('album');
    expect(result[0]!.body).toBe('Reporte A');
    expect(result[0]!.albumMessages?.map(m => m.id)).toEqual(['img-1', 'img-2']);
    // img-3 is its own message with Reporte B
    expect(result[1]!.type).toBe('image');
    expect(result[1]!.id).toBe('img-3');
    expect(result[1]!.body).toBe('Reporte B');
  });

  it('preserves ordering and does not group images across alternating text messages', () => {
    const msgs: WhatsAppMessage[] = [
      baseMessage({ id: 'img-1', timestamp: 1000000 }),
      baseMessage({ id: 'txt-1', type: 'chat', body: 'Texto 1', hasMedia: false, timestamp: 1001000 }),
      baseMessage({ id: 'img-2', timestamp: 1002000 }),
      baseMessage({ id: 'txt-2', type: 'chat', body: 'Texto 2', hasMedia: false, timestamp: 1003000 }),
      baseMessage({ id: 'img-3', timestamp: 1004000 })
    ];

    const result = groupMessagesIntoAlbums(msgs);
    expect(result.length).toBe(5);
    expect(result.map(m => m.id)).toEqual(['img-1', 'txt-1', 'img-2', 'txt-2', 'img-3']);
  });
});

