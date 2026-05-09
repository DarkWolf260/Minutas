/**
 * Pure JS utilities with NO dependencies on UI libraries or React.
 * This file is safe to import in core database logic.
 */

/**
 * Stable stringify that sorts object keys recursively.
 * Ensures consistent output for comparison.
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
 * Deep equality check based on stable stringification.
 */
export function areEqual(a: any, b: any) {
  return stableStringify(a) === stableStringify(b);
}
