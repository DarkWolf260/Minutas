import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdenEmptyStateProps {
  guardias: any[];
}

export const OrdenEmptyState = ({ guardias }: OrdenEmptyStateProps) => {
  return (
    <div className="empty-state-container border rounded-xl bg-card">
      <div className="max-w-md">
        <div className="empty-state-icon-box text-primary bg-primary/10 border-primary/20">
          <Shield className="h-7 w-7" />
        </div>
        <h3 className="empty-state-title text-base sm:text-lg">Esperando Selección</h3>
        <p className="empty-state-desc max-w-sm mt-1">
          Selecciona una guardia en la tarjeta superior para cargar el personal de servicio y comenzar a redactar la orden del día.
        </p>

        {guardias.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">
              No se encontraron guardias configuradas en el sistema.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
              <Link to="/personal">
                <Users className="h-4 w-4" />
                Configurar Guardias en Personal
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

