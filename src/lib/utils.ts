import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Defines the interface for the returned debounced function, including the cancel and flush methods.
interface DebouncedFunction<F extends (...args: any[]) => any> {
  (...args: Parameters<F>): void;
  cancel(): void;
  flush(): void;
}

export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): DebouncedFunction<F> {
  let timeout: NodeJS.Timeout | undefined;
  let lastArgs: Parameters<F> | undefined;

  const debounced: DebouncedFunction<F> = (...args: Parameters<F>): void => {
    lastArgs = args;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = undefined;
      }
    }, waitFor);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    lastArgs = undefined;
  };

  debounced.flush = () => {
    clearTimeout(timeout);
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = undefined;
    }
  };

  return debounced;
}

const RANK_HIERARCHY: Record<string, number> = {
  'OCPC II': 9,
  'OCPC I': 8,
  'OSPC III': 7,
  'OSPC II': 6,
  'OSPC I': 5,
  'OPC III': 4,
  'OPC II': 3,
  'OPC I': 2,
  'OPC': 1,
};

/**
 * Compares two ranks to determine seniority.
 * Higher number means higher seniority (OCPC > OSPC > OPC).
 */
export function compareRanks(a: string | undefined, b: string | undefined): number {
  const rankA = a?.trim() || '';
  const rankB = b?.trim() || '';

  const weightA = RANK_HIERARCHY[rankA] || 0;
  const weightB = RANK_HIERARCHY[rankB] || 0;

  if (weightA !== weightB) {
    return weightB - weightA; // Seniority first
  }

  return 0;
}
