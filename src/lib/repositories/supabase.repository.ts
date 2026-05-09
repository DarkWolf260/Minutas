/**
 * Supabase Repository Base Utilities
 */

import { supabase } from '@/lib/supabase';
import { Observable } from 'rxjs';
import { logger } from '@/lib/logger';
import { silentWrite } from './base.repository';

export function createSupabaseWatchAll<T>(
  tableName: string,
  workspace_id: string,
  options: { 
    orderCol?: string; 
    ascending?: boolean;
    filter?: (query: any) => any;
    select?: string;
  } = {}
): Observable<T[]> {
  const { orderCol = 'id', ascending = true, filter } = options;

  return new Observable<T[]>((subscriber) => {
    let currentData: T[] = [];

    const fetchData = async () => {
      try {
        const selectStr = options.select || '*';
        let query = supabase
          .from(tableName)
          .select(selectStr)
          .eq('workspace_id', workspace_id);
        
        if (filter) query = filter(query);
        if (orderCol) query = query.order(orderCol, { ascending });

        const { data, error } = await query;
        if (error) throw error;
        
        currentData = (data as any) || [];
        subscriber.next(currentData);
      } catch (err) {
        logger.error(`Error fetching supabase data for ${tableName}`, err);
        subscriber.error(err);
      }
    };

    // Initial fetch
    fetchData();

    // Realtime subscription with unique channel name to avoid conflicts if multiple subscribers
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`db-changes-${tableName}-${workspace_id}-${channelId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: tableName, 
        },
        () => {
          // On any change, refetch to ensure consistent state and ordering
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });
}

/**
 * Helper to clean up objects before sending to Supabase to avoid 
 * "invalid input syntax" errors for timestamps when values are "undefined" or null.
 */
const sanitizeForSupabase = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = { ...obj };
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined || clean[key] === null || clean[key] === 'undefined') {
      delete clean[key];
    }
  });
  return clean;
};

/**
 * Standard Supabase CRUD wrappers to match RxDB Repository interface
 */
export const supabaseRepoUtils = {
  add: async (tableName: string, item: any) => 
    silentWrite(async () => {
      const sanitized = sanitizeForSupabase(item);
      const { data, error } = await supabase.from(tableName).insert(sanitized).select().single();
      if (error) throw error;
      return data;
    }, { feature: tableName, rethrow: true }),

  bulkAdd: async (tableName: string, items: any[]) => {
    const sanitized = items.map(sanitizeForSupabase);
    const { error } = await supabase.from(tableName).insert(sanitized);
    if (error) throw error;
  },

  update: async (tableName: string, id: string, updates: any) =>
    silentWrite(async () => {
      const sanitized = sanitizeForSupabase(updates);
      const { error } = await supabase.from(tableName).update(sanitized).eq('id', id);
      if (error) throw error;
    }, { feature: tableName, rethrow: true }),

  remove: async (tableName: string, id: string) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  },

  bulkRemove: async (tableName: string, ids: string[]) => {
    const { error } = await supabase.from(tableName).delete().in('id', ids);
    if (error) throw error;
  },
  
  clearAll: async (tableName: string, workspace_id: string) => {
    const { error } = await supabase.from(tableName).delete().eq('workspace_id', workspace_id);
    if (error) throw error;
  },

  upsert: async (tableName: string, item: any) =>
    silentWrite(async () => {
      const sanitized = sanitizeForSupabase(item);
      const { error } = await supabase.from(tableName).upsert(sanitized, { onConflict: 'id' });
      if (error) throw error;
    }, { feature: tableName, rethrow: true })
};

export function createSupabaseWatchOne<T>(
  tableName: string,
  id: string,
  options: { select?: string } = {}
): Observable<T | null> {
  return new Observable<T | null>((subscriber) => {
    const fetchData = async () => {
      try {
        const selectStr = options.select || '*';
        const { data, error } = await supabase
          .from(tableName)
          .select(selectStr)
          .eq('id', id)
          .maybeSingle();
        
        if (error) throw error;
        subscriber.next((data as any) || null);
      } catch (err) {
        subscriber.error(err);
      }
    };

    fetchData();

    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`db-one-${tableName}-${id}-${channelId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: tableName, 
          filter: `id=eq.${id}` 
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });
}
