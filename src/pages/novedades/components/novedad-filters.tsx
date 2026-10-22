import { Search, ArrowDownWideNarrow, ArrowUpWideNarrow, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NovedadFiltersProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  ordenamiento: 'asc' | 'desc';
  setOrdenamiento: (val: 'asc' | 'desc') => void;
  manejarExportarTodasWord: () => void;
}

export const NovedadFilters = ({ 
  busqueda, 
  setBusqueda, 
  ordenamiento, 
  setOrdenamiento,
  manejarExportarTodasWord
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
            className="pl-8 bg-background border border-border/60 shadow-2xs focus-visible:ring-primary/20 rounded-lg h-8.5 text-xs"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOrdenamiento(ordenamiento === 'asc' ? 'desc' : 'asc')}
          className={cn(
            "h-8.5 w-8.5 shrink-0 rounded-lg border bg-background shadow-2xs hover:bg-muted transition-all duration-300",
            ordenamiento === 'desc' ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground"
          )}
          title={ordenamiento === 'desc' ? "Orden cronológico descendente" : "Orden cronológico ascendente"}
        >
          {ordenamiento === 'desc' ? (
            <ArrowDownWideNarrow className="h-3.5 w-3.5 animate-in fade-in zoom-in duration-300" />
          ) : (
            <ArrowUpWideNarrow className="h-3.5 w-3.5 animate-in fade-in zoom-in duration-300" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={manejarExportarTodasWord}
          className="h-8.5 w-8.5 shrink-0 rounded-lg border bg-background shadow-2xs hover:bg-muted text-primary border-primary/20 bg-primary/5 transition-all duration-300"
          title="Exportar todas las novedades a Word"
        >
          <FileDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
