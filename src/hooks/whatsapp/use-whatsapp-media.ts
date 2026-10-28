import { useState, useEffect, useRef } from 'react';

// Cache bounded to 150 items to prevent memory leaks while avoiding re-fetching
const MAX_CACHE_SIZE = 150;
const mediaBlobCache = new Map<string, string>();
const mediaInFlight = new Map<string, Promise<string | null>>();

export function clearMediaBlobCache(): void {
  for (const blobUrl of mediaBlobCache.values()) {
    if (blobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }
  }
  mediaBlobCache.clear();
  mediaInFlight.clear();
}

export function getMediaBlobCacheSize(): number {
  return mediaBlobCache.size;
}

/**
 * Checks whether an URL needs safe fetching (e.g. converting http:// to blob: on HTTPS)
 */
export function isNeedsSafeFetch(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return false;

  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // If the page is HTTPS and the URL is HTTP or relative /api/
  if (isHttpsPage) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('/')) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves a media URL to a safe URL that can be passed to <img src>, <video src>, or <audio src>
 * without triggering browser Mixed Content blocking or PNA passive element blocks.
 * On HTTPS, insecure http:// URLs (like http://localhost:3001/...) are fetched via fetch()
 * (which succeeds with CORS and PNA headers) and converted to a same-origin blob: URL.
 */
export async function resolveSafeMediaUrl(rawUrl?: string | null): Promise<string | null> {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Already safe inline data or blob URL
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Already cached
  if (mediaBlobCache.has(trimmed)) {
    return mediaBlobCache.get(trimmed)!;
  }

  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // If we are on HTTP or it's an HTTPS URL, it can be loaded directly without Mixed Content
  if (!isHttpsPage && !trimmed.startsWith('/')) {
    return trimmed;
  }
  if (isHttpsPage && trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If on HTTPS and it is an insecure HTTP or relative URL, fetch as blob
  if (mediaInFlight.has(trimmed)) {
    return mediaInFlight.get(trimmed)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error(`Media fetch failed with HTTP ${response.status}`);
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        return null;
      }
      const blobUrl = URL.createObjectURL(blob);

      // LRU eviction if cache exceeds capacity
      if (mediaBlobCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = mediaBlobCache.keys().next().value;
        if (oldestKey) {
          const oldBlobUrl = mediaBlobCache.get(oldestKey);
          mediaBlobCache.delete(oldestKey);
          if (oldBlobUrl && oldBlobUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(oldBlobUrl);
            } catch {}
          }
        }
      }

      mediaBlobCache.set(trimmed, blobUrl);
      return blobUrl;
    } catch (err: any) {
      if (err?.message?.includes('404')) {
        console.debug(`[SafeMedia] Media expired or not cached on WhatsApp server (404), using preview thumbnail: ${trimmed}`);
      } else {
        console.warn(`[SafeMedia] Failed to load media from ${trimmed}:`, err?.message || err);
      }
      return null;
    } finally {
      mediaInFlight.delete(trimmed);
    }
  })();

  mediaInFlight.set(trimmed, fetchPromise);
  return fetchPromise;
}

export interface UseSafeMediaSrcResult {
  src: string | null;
  isLoading: boolean;
  hasError: boolean;
  isBlob: boolean;
}

/**
 * Hook to safely display WhatsApp media (images, audio, video).
 * Immediately displays thumbnail (base64) while asynchronously fetching
 * the full-resolution media and converting it to a blob: URL if needed,
 * preventing any Mixed Content errors on HTTPS.
 */
export function useSafeMediaSrc(
  mediaUrl?: string | null,
  thumbnail?: string | null
): UseSafeMediaSrcResult {
  // Determine immediate displayable source
  const getInitialSrc = (): { src: string | null; loading: boolean } => {
    const cleanMedia = mediaUrl?.trim() || null;
    const cleanThumb = thumbnail?.trim() || null;

    if (cleanMedia && mediaBlobCache.has(cleanMedia)) {
      return { src: mediaBlobCache.get(cleanMedia)!, loading: false };
    }

    // Direct safe URLs
    if (cleanMedia && !isNeedsSafeFetch(cleanMedia)) {
      return { src: cleanMedia, loading: false };
    }

    // Thumbnail is usually an inline base64 data URI (data:image/jpeg;base64,...)
    if (cleanThumb) {
      return { src: cleanThumb, loading: Boolean(cleanMedia) };
    }

    return { src: null, loading: Boolean(cleanMedia) };
  };

  const initial = getInitialSrc();
  const [src, setSrc] = useState<string | null>(initial.src);
  const [isLoading, setIsLoading] = useState<boolean>(initial.loading);
  const [hasError, setHasError] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    const cleanMedia = mediaUrl?.trim() || null;
    const cleanThumb = thumbnail?.trim() || null;

    // Reset error on input change
    setHasError(false);

    // If media is already in cache
    if (cleanMedia && mediaBlobCache.has(cleanMedia)) {
      setSrc(mediaBlobCache.get(cleanMedia)!);
      setIsLoading(false);
      return;
    }

    // If media is a direct safe URL (e.g. data:, blob:, or https://)
    if (cleanMedia && !isNeedsSafeFetch(cleanMedia)) {
      setSrc(cleanMedia);
      setIsLoading(false);
      return;
    }

    // If we have a thumbnail, display it immediately as preview
    if (cleanThumb) {
      setSrc(cleanThumb);
    } else {
      setSrc(null);
    }

    // If no mediaUrl to fetch, we are done
    if (!cleanMedia) {
      setIsLoading(false);
      return;
    }

    // Fetch full resolution media
    setIsLoading(true);
    let isCancelled = false;

    resolveSafeMediaUrl(cleanMedia)
      .then((resolvedBlobUrl) => {
        if (isCancelled || !isMountedRef.current) return;
        if (resolvedBlobUrl) {
          setSrc(resolvedBlobUrl);
          setIsLoading(false);
          setHasError(false);
        } else {
          // If fetch failed: if thumbnail was present, keep thumbnail visible!
          if (!cleanThumb) {
            setHasError(true);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isCancelled || !isMountedRef.current) return;
        if (!cleanThumb) {
          setHasError(true);
        }
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [mediaUrl, thumbnail]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    src,
    isLoading,
    hasError,
    isBlob: Boolean(src && src.startsWith('blob:'))
  };
}

/**
 * Downloads a media resource safely without triggering navigation or Mixed Content blocks.
 */
export async function downloadMediaSafe(url: string, filename = 'whatsapp-media'): Promise<void> {
  try {
    let downloadUrl = url;
    if (mediaBlobCache.has(url)) {
      downloadUrl = mediaBlobCache.get(url)!;
    } else if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      const resolved = await resolveSafeMediaUrl(url);
      if (resolved) {
        downloadUrl = resolved;
      }
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('[SafeMedia] Failed to download media:', err);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
