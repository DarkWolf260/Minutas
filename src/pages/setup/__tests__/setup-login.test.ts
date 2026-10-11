import { describe, it, expect, beforeEach } from 'vitest';
import { SETUP_DONE_KEY, trySet, tryGet, tryRemove } from '@/hooks/configuracion';

describe('Setup Login Flow & Storage Cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('correctly sets and removes setup-related storage flags', () => {
    trySet('minutas-setup-step', '2');
    trySet('minutas-setup-workspace', 'test-ws');
    trySet('minutas-setup-roles-v1', JSON.stringify([{ id: 'r1', name: 'Role 1' }]));
    trySet('minutas-setup-depts-v1', JSON.stringify([{ id: 'd1', name: 'Dept 1' }]));

    expect(tryGet('minutas-setup-step')).toBe('2');
    expect(tryGet('minutas-setup-workspace')).toBe('test-ws');

    // Simulate login completion cleanup
    trySet(SETUP_DONE_KEY, 'true');
    tryRemove('minutas-setup-step');
    tryRemove('minutas-setup-workspace');
    tryRemove('minutas-setup-roles-v1');
    tryRemove('minutas-setup-depts-v1');
    trySet('minutas-template-bootstrap-ok', 'true');

    expect(tryGet(SETUP_DONE_KEY)).toBe('true');
    expect(tryGet('minutas-setup-step')).toBeNull();
    expect(tryGet('minutas-setup-workspace')).toBeNull();
    expect(tryGet('minutas-setup-roles-v1')).toBeNull();
    expect(tryGet('minutas-setup-depts-v1')).toBeNull();
    expect(tryGet('minutas-template-bootstrap-ok')).toBe('true');
  });

  it('preserves offline workspace tokens while marking setup as complete', () => {
    localStorage.setItem('active-workspace', 'operaciones-central');
    trySet(SETUP_DONE_KEY, 'true');

    expect(localStorage.getItem('active-workspace')).toBe('operaciones-central');
    expect(tryGet(SETUP_DONE_KEY)).toBe('true');
  });
});
