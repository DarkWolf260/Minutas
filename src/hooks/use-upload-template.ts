import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Template } from '@/lib/types';
import { toast } from 'sonner';

export function useUploadTemplate() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadTemplate = async (template: Template, description?: string) => {
    setIsUploading(true);
    try {
      // Basic validation
      if (!template.name || !template.content) {
        throw new Error('La plantilla debe tener un nombre y contenido válidos.');
      }

      const { data, error } = await supabase
        .from('templates')
        .upsert(
          [
            {
              name: template.name,
              content: template.content,
              description: description || `Plantilla para reportes de ${template.name}`,
              type: 'normal', // Default for user uploads
              statisticsCategory: template.statisticsCategory,
              statisticsSubCategories: template.statisticsSubCategories,
              statisticsRules: template.statisticsRules,
            },
          ], 
          { onConflict: 'name' }
        )
        .select();

      if (error) throw error;

      toast.success(`Plantilla "${template.name}" publicada en la comunidad.`);
      return { data, error: null };
    } catch (err: any) {
      console.error('Detailed Upload error:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        error: err
      });
      
      const errorMessage = err.details || err.message || 'Error al publicar la plantilla';
      toast.error(errorMessage);
      return { data: null, error: err };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadTemplate,
    isUploading,
  };
}
