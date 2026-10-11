import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdenEmptyStateProps {
  guardias: any[];
}

export const OrdenEmptyState = ({ guardias }: OrdenEmptyStateProps) => {
  return (
    <div className="text-center py-16 sm:py-20 border-2 border-dashed rounded-3xl bg-muted/10 border-border/60 transition-all h-full flex flex-col items-center justify-center p-6">
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl w-14 h-14 mx-auto mb-4 flex items-center justify-center text-primary shadow-xs">
        <Shield className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold tracking-tight mb-1 text-foreground">
        Esperando Selección
      </h3>
      <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto text-center px-4">
        Selecciona una guardia en la tarjeta superior para cargar el personal de servicio y comenzar a redactar la orden del día.
      </p>

      {guardias.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            No se encontraron guardias configuradas en el sistema.
          </p>
          <Button asChild variant="outline" className="rounded-xl gap-2 text-xs">
            <Link to="/personal">
              <Users className="h-4 w-4" />
              Configurar Guardias en Personal
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

