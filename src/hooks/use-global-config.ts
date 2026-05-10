import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface GlobalConfig {
  system_name: string;
  org_name: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
}

export function useGlobalConfig() {
  const [config, setConfig] = useState<GlobalConfig>({
    system_name: 'Minutas Cloud',
    org_name: 'Municipalidad',
    maintenance_mode: false,
    allow_registration: true
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
        const newConfig = { ...config };
        data.forEach((item: any) => {
          if (item.key in newConfig) {
            (newConfig as any)[item.key] = item.value;
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
  }, []);

  const updateConfig = async (key: keyof GlobalConfig, value: any) => {
    try {
      const { error } = await supabase
        .from('global_config')
        .upsert({ 
          key, 
          value, 
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setConfig(prev => ({ ...prev, [key]: value }));
      toast.success('Configuración actualizada');
      return true;
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Error al actualizar configuración: ' + error.message);
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
