import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface GlobalConfig {
  maintenance_mode: boolean;
  allow_registration: boolean;
  app_version: string;
}

const BOOLEAN_KEYS = ['maintenance_mode', 'allow_registration'];

export function useGlobalConfig() {
  const [config, setConfig] = useState<GlobalConfig>({
    maintenance_mode: false,
    allow_registration: true,
    app_version: 'v1.3.4-cloud'
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_config')
        .select('key, value');

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

      const { error } = await supabase
        .from('global_config')
        .upsert({ 
          key, 
          value, 
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

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

  return {
    config,
    loading,
    updateConfig,
    refresh: fetchConfig
  };
}
