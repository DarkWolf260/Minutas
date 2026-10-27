import { Search, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NovedadFiltersProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  ordenamiento: 'asc' | 'desc';
  setOrdenamiento: (val: 'asc' | 'desc') => void;
  manejarExportarTodasWord?: () => void;
}

export const NovedadFilters = ({ 
  busqueda, 
  setBusqueda, 
  ordenamiento, 
  setOrdenamiento,
}: NovedadFiltersProps) => {
  return (
    <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-muted/5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            id="report-search"
            name="report-search"
            placeholder="Buscar reportes..."
            className="pl-8 bg-background border border-border/60 shadow-2xs focus-visible:ring-primary/20 rounded-lg h-9 text-xs sm:text-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOrdenamiento(ordenamiento === 'asc' ? 'desc' : 'asc')}
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg border bg-background shadow-2xs hover:bg-muted",
            ordenamiento === 'desc' ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground"
          )}
          title={ordenamiento === 'desc' ? "Orden cronológico descendente" : "Orden cronológico ascendente"}
        >
          {ordenamiento === 'desc' ? (
            <ArrowDownWideNarrow className="h-4 w-4" />
          ) : (
            <ArrowUpWideNarrow className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
