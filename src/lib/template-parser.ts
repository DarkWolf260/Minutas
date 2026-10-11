/**
 * Template Parser - Backwards Compatibility Layer
 *
 * All core template functionality has been modularized into `@/lib/template`.
 * This module re-exports the public API to ensure complete backwards compatibility.
 */

export * from './template';
export { applyModifiers as applyTextModifier } from './template';

