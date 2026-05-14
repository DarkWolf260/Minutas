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
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-b bg-muted/5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="report-search"
            name="report-search"
            placeholder="Buscar reportes..."
            className="pl-9 bg-background border-none shadow-sm focus-visible:ring-primary/20 rounded-lg h-10 text-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOrdenamiento(ordenamiento === 'asc' ? 'desc' : 'asc')}
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg border bg-background shadow-sm hover:bg-muted transition-all duration-300",
            ordenamiento === 'desc' ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground"
          )}
          title={ordenamiento === 'desc' ? "Orden cronológico descendente" : "Orden cronológico ascendente"}
        >
          {ordenamiento === 'desc' ? (
            <ArrowDownWideNarrow className="h-4 w-4 animate-in fade-in zoom-in duration-300" />
          ) : (
            <ArrowUpWideNarrow className="h-4 w-4 animate-in fade-in zoom-in duration-300" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={manejarExportarTodasWord}
          className="h-9 w-9 shrink-0 rounded-lg border bg-background shadow-sm hover:bg-muted text-primary border-primary/20 bg-primary/5 transition-all duration-300"
          title="Exportar todas las novedades a Word"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
