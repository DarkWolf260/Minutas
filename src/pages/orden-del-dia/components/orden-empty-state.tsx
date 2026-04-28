import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdenEmptyStateProps {
  guardias: any[];
}

export const OrdenEmptyState = ({ guardias }: OrdenEmptyStateProps) => {
  return (
    <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-muted/50 transition-all hover:bg-muted/30 h-full flex flex-col items-center justify-center">
      <div className="bg-muted p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Lock className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <h3 className="text-lg font-bold mb-1">Esperando Selección</h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto text-center px-4">
        Por favor, selecciona una guardia en el panel superior para cargar el formulario de operaciones.
      </p>
      {guardias.length === 0 && (
        <div className="mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/personal">
              Configurar Guardias en Personal
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};
