import CryptoJS from 'crypto-js';

/**
 * Universal Polyfill for Web Crypto API (crypto.subtle.digest & crypto.randomUUID).
 *
 * Browsers disable `crypto.subtle` in non-secure contexts (such as accessing via HTTP on LAN IP).
 * This polyfill guarantees that `window.crypto.subtle.digest` and `window.crypto.randomUUID`
 * are always defined, allowing RxDB and other crypto tools to run smoothly in any environment.
 */
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {};
  }

  // 1. Polyfill crypto.randomUUID if missing
  if (typeof window.crypto.randomUUID !== 'function') {
    const polyfillUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };

    try {
      Object.defineProperty(window.crypto, 'randomUUID', {
        value: polyfillUUID,
        configurable: true,
        writable: true,
      });
    } catch {
      (window.crypto as any).randomUUID = polyfillUUID;
    }
  }

  // 2. Polyfill crypto.subtle and crypto.subtle.digest if missing
  const subtleExists =
    typeof window.crypto.subtle !== 'undefined' &&
    typeof window.crypto.subtle.digest === 'function';

  if (!subtleExists) {
    const fakeSubtle = {
      digest: async function (
        _algorithm: AlgorithmIdentifier,
        data: BufferSource
      ): Promise<ArrayBuffer> {
        let arrayBuffer: ArrayBuffer;
        if (data instanceof ArrayBuffer) {
          arrayBuffer = data;
        } else if (ArrayBuffer.isView(data)) {
          arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        } else {
          arrayBuffer = new ArrayBuffer(0);
        }

        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i] ?? 0);
        }

        const wordArray = CryptoJS.enc.Latin1.parse(binary);
        const hash = CryptoJS.SHA256(wordArray);

        const words = hash.words;
        const sigBytes = hash.sigBytes;
        const u8 = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; i++) {
          const w = words[i >>> 2] ?? 0;
          const byte = (w >>> (24 - (i % 4) * 8)) & 0xff;
          u8[i] = byte;
        }
        return u8.buffer;
      },
    };

    try {
      Object.defineProperty(window.crypto, 'subtle', {
        value: fakeSubtle,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    } catch {
      try {
        if (typeof Crypto !== 'undefined' && Crypto.prototype) {
          Object.defineProperty(Crypto.prototype, 'subtle', {
            get: () => fakeSubtle,
            configurable: true,
            enumerable: true,
          });
        }
      } catch {
        (window.crypto as any).subtle = fakeSubtle;
      }
    }
  }
}
