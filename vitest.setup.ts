import '@testing-library/jest-dom';

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  };
}

try {
  if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMockStorage(),
      writable: true,
      configurable: true,
    });
  }
} catch (_) {}

try {
  if (!globalThis.sessionStorage || typeof globalThis.sessionStorage.clear !== 'function') {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMockStorage(),
      writable: true,
      configurable: true,
    });
  }
} catch (_) {}

