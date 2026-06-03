import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, callWithTokenRefresh } from '@/lib/supabase';
import { toast } from 'sonner';
import type { AppModuleId } from '@/lib/types';

export interface GlobalConfig {
  maintenance_mode: boolean;
  allow_registration: boolean;
  disabled_modules_admins: AppModuleId[];
}

interface GlobalConfigContextProps {
  config: GlobalConfig;
  loading: boolean;
  updateConfig: (key: keyof GlobalConfig, value: any) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const BOOLEAN_KEYS = ['maintenance_mode', 'allow_registration'];
const ARRAY_KEYS = ['disabled_modules_admins'];

const GlobalConfigContext = createContext<GlobalConfigContextProps | undefined>(undefined);

export function GlobalConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<GlobalConfig>({
    maintenance_mode: false,
    allow_registration: true,
    disabled_modules_admins: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await callWithTokenRefresh<any[]>(() => 
        supabase
          .from('global_config')
          .select('key, value')
      );

      if (error) throw error;

      if (data) {
        console.log('[GlobalConfig] Fetched:', data);
        const newConfig = { ...config };
        data.forEach((item: any) => {
          if (item.key in newConfig) {
            let val = item.value;
            // Robust boolean casting
            if (BOOLEAN_KEYS.includes(item.key)) {
              val = String(val).toLowerCase() === 'true' || val === true || val === 1;
            } else if (ARRAY_KEYS.includes(item.key)) {
              if (typeof val === 'string') {
                try { val = JSON.parse(val); } catch (e) { val = val ? val.split(',').map((s: string) => s.trim()) : []; }
              }
              if (!Array.isArray(val)) val = [];
            }
            (newConfig as any)[item.key] = val;
          }
        });
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Error fetching global config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Subscribe to real-time changes
    const channelId = `global-config-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelId);
    
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_config' },
        (payload) => {
          const newItem = payload.new as any;
          if (!newItem || !newItem.key) return;

          let val = newItem.value;
          if (BOOLEAN_KEYS.includes(newItem.key)) {
            val = String(val).toLowerCase() === 'true' || val === true || val === 1;
          } else if (ARRAY_KEYS.includes(newItem.key)) {
            if (typeof val === 'string') {
              try { val = JSON.parse(val); } catch (e) { val = val ? val.split(',').map((s: string) => s.trim()) : []; }
            }
            if (!Array.isArray(val)) val = [];
          }

          setConfig(prev => {
            if (newItem.key in prev) {
              return { ...prev, [newItem.key]: val };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateConfig = async (key: keyof GlobalConfig, value: any) => {
    try {
      // Optimistic update
      setConfig(prev => ({ ...prev, [key]: value }));

      let dbValue = value;
      if (ARRAY_KEYS.includes(key)) {
        dbValue = JSON.stringify(value);
      }

      const { error } = await callWithTokenRefresh<any>(() => 
        supabase
          .from('global_config')
          .upsert({ 
            key, 
            value: dbValue, 
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
      );

      if (error) throw error;
      
      toast.success('Configuración actualizada');
      return true;
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Error al actualizar configuración: ' + error.message);
      // Rollback on error
      fetchConfig();
      return false;
    }
  };

  return React.createElement(
    GlobalConfigContext.Provider,
    { value: { config, loading, updateConfig, refresh: fetchConfig } },
    children
  );
}

export function useGlobalConfig() {
  const context = useContext(GlobalConfigContext);
  if (context === undefined) {
    throw new Error('useGlobalConfig must be used within a GlobalConfigProvider');
  }
  return context;
}
