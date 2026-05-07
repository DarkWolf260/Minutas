import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Template } from '@/lib/types';
import { toast } from 'sonner';

export interface CommunityTemplate {
  id: string;
  name: string;
  content: string;
  description?: string;
  type: 'normal' | 'relevante';
  created_at?: string;
  statisticsCategory?: string | null;
  statistics_sub_categories?: string[] | null;
  statistics_rules?: any[] | null;
}

export function useCommunityTemplates() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching community templates:', err);
      setError(err.message || 'Error al cargar plantillas de la comunidad');
      // No mostramos toast aquí para no ser intrusivos si falla el primer carga
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
}

