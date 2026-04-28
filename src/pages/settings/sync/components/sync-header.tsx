import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SyncHeaderProps {
  usuario?: any;
  esPrincipal?: boolean;
  esSecundario?: boolean;
  modoSimple?: boolean;
}

export const SyncHeader = ({ usuario, esPrincipal, esSecundario, modoSimple = false }: SyncHeaderProps) => {
  return (
    <div className="flex items-center gap-4 shrink-0">
      <Link to="/settings">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold tracking-tight">Sincronización</h1>
        {modoSimple ? (
          <p className="text-sm text-muted-foreground">
            Conecta dispositivos para compartir reportes en tiempo real.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground truncate">{usuario?.email}</p>
        )}
      </div>
      {!modoSimple && (
        <Badge variant={esPrincipal ? 'default' : 'secondary'} className="shrink-0 h-7 rounded-lg">
          {esPrincipal ? (
            <><Monitor className="h-3 w-3 mr-1.5" />Principal</>
          ) : (
            <><Smartphone className="h-3 w-3 mr-1.5" />Secundario</>
          )}
        </Badge>
      )}
    </div>
  );
};
