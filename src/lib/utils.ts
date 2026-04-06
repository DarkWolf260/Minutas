import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  FileText, 
  ClipboardCheck, 
  Globe, 
  Activity, 
  Truck, 
  AlertTriangle, 
  GraduationCap, 
  Presentation,
  type LucideIcon
} from 'lucide-react';

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

/**
 * Stable stringify that sorts object keys recursively
 */
export function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',') + '}';
}

/**
 * Deep equality check based on stable stringification
 */
export function areEqual(a: any, b: any) {
  return stableStringify(a) === stableStringify(b);
}

/**
 * Extracts the first two initials from a name string
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    const p = parts[0];
    return p ? p.substring(0, 2).toUpperCase() : 'U';
  }
  const p1 = parts[0]?.[0] || '';
  const p2 = parts[1]?.[0] || '';
  return (p1 + p2).toUpperCase() || 'U';
}

/**
 * Validates a Time HLV string.
 * Checks for missing digits (dashes) and enforces range format for finalized reports.
 */
export function validateTimeHlv(value: any, isFinalizado: boolean = false): { isValid: boolean; error: string | null } {
  const time = String(value || '').trim();
  const digits = time.replace(/\D/g, ''); // Extract only digits
  
  if (!time || digits.length === 0) {
    return { isValid: false, error: 'La hora es obligatoria.' };
  }

  // 1. Check for incompleteness based on digit count
  // Single time part needs exactly 4 digits, range needs exactly 8.
  if (digits.length > 0 && digits.length < 4) {
    return { isValid: false, error: 'La hora está incompleta. Por favor, rellena todos los dígitos.' };
  }
  
  if (digits.length > 4 && digits.length < 8) {
    return { isValid: false, error: 'El rango de hora está incompleto. Por favor, rellena todos los dígitos.' };
  }

  // 2. Check for range if finalized (must have 8 digits)
  if (isFinalizado && digits.length < 8) {
    return { isValid: false, error: 'Para finalizar un reporte, la hora debe ser un rango (ej: 11:11 HLV - 11:11 HLV).' };
  }

  return { isValid: true, error: null };
}

/**
 * Returns the appropriate icon component for a template based on its name.
 */
export function getTemplateIcon(name: string = ''): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('guardia preventiva')) return ClipboardCheck;
  if (n.includes('recorrido preventivo')) return Globe;
  if (n.includes('atención prehospitalaria y traslado')) return Truck;
  if (n.includes('atención prehospitalaria')) return Activity;
  if (n.includes('accidente de tránsito')) return AlertTriangle;
  if (n.includes('capacitación')) return GraduationCap;
  if (n.includes('sesión educativa')) return Presentation;
  return FileText;
}

/**
 * Normalizes a string by converting it to lowercase and removing diacritics (accents).
 * Helpful for accent-insensitive search.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Decompose combined characters into base + accent
    .replace(/[\u0300-\u036f]/g, ''); // Remove the accent characters
}
