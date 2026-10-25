'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface AppBarActionPortalProps {
  children: React.ReactNode;
}

/**
 * Renders action buttons or tabs directly into the global AppBar.
 * Preserves React Context (e.g. TabsContext) and state bindings.
 */
export function AppBarActionPortal({ children }: AppBarActionPortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(() => {
    if (typeof document !== 'undefined') {
      return document.getElementById('app-bar-actions');
    }
    return null;
  });

  useEffect(() => {
    if (!container) {
      setContainer(document.getElementById('app-bar-actions'));
    }
  }, [container]);

  if (!container) return null;
  return createPortal(children, container);
}

export default AppBarActionPortal;
