import { describe, it, expect } from 'vitest';
import { getLogicalState, ensureParsed, commonConflictHandler } from '../db';
import { reportsSchema } from '../schemas';

describe('Database schemas and conflict resolution', () => {
  it('reportsSchema has version 4 and compound index on [workspace_id, timestamp]', () => {
    expect(reportsSchema.version).toBe(4);
    expect(reportsSchema.indexes).toContainEqual(['workspace_id', 'timestamp']);
    expect(reportsSchema.properties.timestamp.maxLength).toBe(50);
  });

  describe('getLogicalState', () => {
    it('strips internal metadata (_rev, _meta, modified) while preserving _deleted', () => {
      const doc = {
        id: 'rep-1',
        workspace_id: 'ws-1',
        title: 'Incidente',
        _rev: '1-abcdef',
        _meta: { lwt: 123 },
        modified: '2026-09-20T10:00:00Z',
        _deleted: false,
      };

      const logical = getLogicalState(doc);
      expect(logical).toEqual({
        id: 'rep-1',
        workspace_id: 'ws-1',
        title: 'Incidente',
        _deleted: false,
      });
      expect(logical._rev).toBeUndefined();
      expect(logical.modified).toBeUndefined();
    });

    it('parses stringified JSON fields when cleaning', () => {
      const doc = {
        id: 'cfg-1',
        workspace_id: 'ws-1',
        data: JSON.stringify({ active_guard_id: 'g-1' }),
      };

      const logical = getLogicalState(doc);
      expect(logical.data).toEqual({ active_guard_id: 'g-1' });
    });
  });

  describe('ensureParsed', () => {
    it('ensures json fields that are strings become parsed objects', () => {
      const raw = {
        id: 'r-1',
        form_data: '{"fieldA": "valueA"}',
        sections: '[{"title": "Sec 1"}]',
      };

      const parsed = ensureParsed(raw);
      expect(parsed.form_data).toEqual({ fieldA: 'valueA' });
      expect(parsed.sections).toEqual([{ title: 'Sec 1' }]);
    });
  });

  describe('commonConflictHandler', () => {
    it('isEqual returns true when data is identical despite differing metadata', () => {
      const local = {
        id: 'item-1',
        workspace_id: 'ws-1',
        data: { a: 1, b: 2 },
        modified: '2026-09-20T10:00:00Z',
        _rev: '1-local',
      };

      const master = {
        id: 'item-1',
        workspace_id: 'ws-1',
        data: { a: 1, b: 2 },
        modified: '2026-09-20T11:00:00Z',
        _rev: '2-master',
      };

      expect(commonConflictHandler.isEqual(local, master)).toBe(true);
    });

    it('resolve retains cloud modified timestamp and merges data objects', async () => {
      const local = {
        id: 'settings',
        workspace_id: 'ws-1',
        data: { new_setting: 'yes' },
        modified: '2026-09-20T12:00:00Z',
      };

      const master = {
        id: 'settings',
        workspace_id: 'ws-1',
        data: { existing_setting: 'persisted' },
        modified: '2026-09-20T12:05:00Z',
      };

      const resolved = await commonConflictHandler.resolve({
        realMasterState: master,
        newDocumentState: local,
      });

      expect(resolved.modified).toBe('2026-09-20T12:05:00Z');
      expect(resolved.data).toEqual({
        existing_setting: 'persisted',
        new_setting: 'yes',
      });
    });
  });
});
