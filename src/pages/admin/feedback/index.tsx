import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ChevronLeft,
  MessageSquare,
  Trash2,
  Bug,
  Lightbulb,
  ThumbsUp,
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  type: 'sugerencia' | 'error' | 'elogio' | 'otro';
  message: string;
  app_version: string;
  created_at: string;
}

const TYPE_CONFIG = {
  sugerencia: {
    label: 'Sugerencia',
    icon: Lightbulb,
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    cardBorder: 'hover:border-amber-500/30 border-amber-500/10'
  },
  error: {
    label: 'Error / Bug',
    icon: Bug,
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    cardBorder: 'hover:border-rose-500/30 border-rose-500/10'
  },
  elogio: {
    label: 'Elogio',
    icon: ThumbsUp,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cardBorder: 'hover:border-emerald-500/30 border-emerald-500/10'
  },
  otro: {
    label: 'Otro',
    icon: MessageSquare,
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    cardBorder: 'hover:border-blue-500/30 border-blue-500/10'
  }
};

export default function AdminFeedbackPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err: any) {
      console.error('Error fetching feedback:', err);
      toast.error('Error al cargar la bandeja de comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeedback(prev => prev.filter(item => item.id !== id));
      toast.success('Comentario eliminado con éxito');
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err: any) {
      toast.error('No se pudo eliminar el comentario');
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const filteredFeedback = feedback.filter(item => 
    filterType === 'all' ? true : item.type === filterType
  );

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1700px] mx-auto flex flex-col gap-8">
        
        {/* CABECERA (ESTÁNDAR APP) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight">Bandeja de Feedback</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Revisa los comentarios, sugerencias y errores reportados por los usuarios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg shrink-0 border-muted/60 hover:bg-muted"
              onClick={fetchFeedback}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 px-3 rounded-lg border border-muted/60 bg-background text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos los Tipos</option>
              <option value="sugerencia">Sugerencias</option>
              <option value="error">Errores / Bugs</option>
              <option value="elogio">Elogios</option>
              <option value="otro">Otros</option>
            </select>
            
            <Badge variant="outline" className="h-10 px-4 rounded-lg border-muted/60 bg-muted/20 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              {filteredFeedback.length} Comentarios
            </Badge>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2Spinner />
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">Cargando bandeja...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-muted/20 rounded-2xl bg-muted/5">
            <MessageSquare className="h-16 w-16 text-muted/20 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-muted-foreground">Bandeja vacía</h3>
            <p className="text-sm text-muted-foreground/60 mt-2">No hay comentarios en esta categoría.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFeedback.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.otro;
              const Icon = cfg.icon;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "group shadow-md overflow-hidden relative bg-card/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 border cursor-pointer",
                    cfg.cardBorder
                  )}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardHeader className="py-4 px-5 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shadow-inner", cfg.badgeClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge className={cn("rounded-md border-none text-[10px] font-bold px-2 py-0.5", cfg.badgeClass)}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-4">
                    <p className="text-sm text-foreground line-clamp-4 leading-relaxed font-medium min-h-[80px]">
                      {item.message}
                    </p>
                    <div className="pt-4 border-t border-primary/5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('es-VE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <Badge variant="outline" className="font-mono text-[9px] rounded-md px-1.5 py-0 border-muted/50">
                        v{item.app_version || '1.0.0'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-muted/60 shadow-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", TYPE_CONFIG[selectedItem.type]?.badgeClass)}>
                    {React.createElement(TYPE_CONFIG[selectedItem.type]?.icon || MessageSquare, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      Detalle del Comentario
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Enviado el {new Date(selectedItem.created_at).toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="p-4 rounded-xl bg-muted/20 border border-muted/40 max-h-[40vh] overflow-y-auto custom-scrollbar">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground">
                    {selectedItem.message}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-primary/75" />
                    Versión del Cliente:
                  </span>
                  <Badge variant="secondary" className="font-mono text-xs rounded-lg px-2">
                    v{selectedItem.app_version || '1.0.0'}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="destructive"
                  className="rounded-xl font-bold transition-all duration-150 active:scale-95 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => selectedItem && handleDelete(selectedItem.id, e)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl font-bold transition-all duration-150 active:scale-95"
                  onClick={() => setSelectedItem(null)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
  );
}
