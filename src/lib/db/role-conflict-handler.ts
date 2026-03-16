/**
 * Custom conflict handler for RxDB that enforces role-based authority.
 * Anfitrión (Host) always wins against Seguidores (Followers).
 */

import { RxConflictHandler, RxConflictHandlerInput, defaultConflictHandler } from 'rxdb';

// Global state to track current role for conflict resolution
// This is updated by the P2P provider
let currentLocalRole: 'host' | 'follower' | 'undetermined' = 'undetermined';

export function setCurrentLocalRole(role: 'host' | 'follower' | 'undetermined') {
  currentLocalRole = role;
}

/**
 * A conflict handler that prioritizes data based on the device role.
 * - If this device is 'host', it rejects remote changes in a conflict (local wins).
 * - If this device is 'follower', it accepts remote changes in a conflict (remote wins).
 * - If roles are equal or undetermined, it falls back to the default LWW (Last Write Wins) strategy.
 */
/**
 * A conflict handler that prioritizes data based on the device role.
 * - If this device is 'host', it rejects remote changes in a conflict (local wins).
 * - If this device is 'follower', it accepts remote changes in a conflict (remote wins).
 * - If roles are equal or undetermined, it falls back to a default LWW (Last Write Wins) strategy.
 */
export const roleBasedConflictHandler: RxConflictHandler<any> = {
  isEqual: function(a: any, b: any, context: string): boolean {
    // If the documents have the same revision, they are definitely equal
    if (a._rev && b._rev && a._rev === b._rev) {
      return true;
    }
    
    // Fallback: If revisions are missing or different, we could do a deep equal,
    // but RxDB usually expects revisions to be the primary indicator.
    // For our role-based logic, we primarily care about the role in 'resolve'.
    return false;
  },
  resolve: async function(input: RxConflictHandlerInput<any>, context: string) {
    // If we are 'host', our local state is the "authority"
    if (currentLocalRole === 'host') {
      return input.newDocumentState;
    }

    // If we are 'follower', we strictly follow the remote (assumed to be host or authoritative)
    if (currentLocalRole === 'follower') {
      return input.realMasterState;
    }

    // Fallback to RxDB default (Last Write Wins) if roles aren't clearly defined
    // We use revisions to determine which one is "newer"
    const revA = input.newDocumentState._rev || '';
    const revB = input.realMasterState._rev || '';
    
    if (revA > revB) {
      return input.newDocumentState;
    }
    return input.realMasterState;
  }
};
