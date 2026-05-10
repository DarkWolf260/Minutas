import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface CloudTemplate {
  id: string;
  name: string;
  content: string;
  type: 'normal' | 'relevante';
  created_at?: string;
  statistics_category?: string | null;
  statistics_sub_categories?: string[] | null;
  statistics_rules?: any[] | null;
}

export function useCloudTemplates() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<CloudTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Sin conexión a internet');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, content, type, statistics_category, statistics_sub_categories, statistics_rules')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching cloud templates:', err);
      setError(err.message || 'Error al cargar plantillas cloud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();

    const handleOnline = () => fetchTemplates();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
}

