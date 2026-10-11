import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'minutas-sidebar-expanded';
const EVENT_KEY = 'minutas-sidebar-toggled';

let isGlobalListenerActive = false;
let lastToggleTimestamp = 0;

export function toggleSidebarGlobal() {
  if (typeof window === 'undefined') return;
  const current = localStorage.getItem(STORAGE_KEY) === 'true';
  const next = !current;
  localStorage.setItem(STORAGE_KEY, String(next));
  window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: { isExpanded: next } }));
}

function initGlobalSidebarShortcut() {
  if (isGlobalListenerActive || typeof window === 'undefined') return;
  isGlobalListenerActive = true;

  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea or contenteditable
      const target = e.target as HTMLElement;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b' || e.code === 'KeyB')) {
        e.preventDefault();
        e.stopPropagation();

        // Prevent double toggles from multiple listeners or rapid keydown events
        const now = Date.now();
        if (now - lastToggleTimestamp < 250) return;
        lastToggleTimestamp = now;

        toggleSidebarGlobal();
      }
    },
    { capture: true }
  );
}

// Initialize once when module loads in browser
if (typeof window !== 'undefined') {
  initGlobalSidebarShortcut();
}

export function useSidebarExpanded() {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    initGlobalSidebarShortcut();

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isExpanded?: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isExpanded === 'boolean') {
        setIsExpanded(customEvent.detail.isExpanded);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY) === 'true';
        setIsExpanded(saved);
      }
    };

    window.addEventListener(EVENT_KEY, handleToggle);
    return () => window.removeEventListener(EVENT_KEY, handleToggle);
  }, []);

  const toggleExpanded = useCallback(() => {
    toggleSidebarGlobal();
  }, []);

  const setExpanded = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setIsExpanded(value);
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: { isExpanded: value } }));
  }, []);

  return { isExpanded, toggleExpanded, setExpanded };
}

