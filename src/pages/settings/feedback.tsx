import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChevronLeft,
  MessageSquarePlus,
  Send,
  ThumbsUp,
  Bug,
  Lightbulb,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type FeedbackType = 'sugerencia' | 'error' | 'elogio' | 'otro';

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  icon: typeof Heart;
  selected: string;
  idle: string;
}[] = [
  {
    value: 'sugerencia',
    label: 'Sugerencia',
    icon: Lightbulb,
    selected: 'border-amber-500 bg-amber-500/10 text-amber-600',
    idle: 'border-border text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-600',
  },
  {
    value: 'error',
    label: 'Error / Bug',
    icon: Bug,
    selected: 'border-rose-500 bg-rose-500/10 text-rose-600',
    idle: 'border-border text-muted-foreground hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-600',
  },
  {
    value: 'elogio',
    label: 'Elogio',
    icon: ThumbsUp,
    selected: 'border-emerald-500 bg-emerald-500/10 text-emerald-600',
    idle: 'border-border text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600',
  },
  {
    value: 'otro',
    label: 'Otro',
    icon: MessageSquarePlus,
    selected: 'border-primary bg-primary/10 text-primary',
    idle: 'border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
  },
];

const PLACEHOLDERS: Record<FeedbackType, string> = {
  sugerencia: '¿Qué funcionalidad añadirías o cambiarías? Cuantos más detalles incluyas, más fácil será evaluarla.',
  error: 'Describe el error: ¿qué estabas haciendo? ¿qué ocurrió? ¿se repite siempre?',
  elogio: '¿Qué es lo que más te gusta de la aplicación? Nos alegra saber qué funciona bien.',
  otro: 'Escribe lo que quieras compartir...',
};

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>('sugerencia');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error('Escribe un mensaje antes de enviar.');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        type,
        message: trimmed,
        app_version: '1.0.1',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSentCount((c) => c + 1);
      setMessage('');
      toast.success('¡Comentario enviado! Gracias por tu ayuda 🙌');
    } catch (err: unknown) {
      console.error('Feedback error:', err);
      toast.error('No se pudo enviar el comentario. Comprueba tu conexión.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[650px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/settings" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enviar Comentarios</h1>
            <p className="text-muted-foreground text-sm">
              Tu opinión ayuda a mejorar la aplicación para todos.
            </p>
          </div>
        </div>

        {/* Motivational banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Tu ayuda importa</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Puedes enviar tantos comentarios como necesites, sea para reportar errores,
              proponer mejoras o simplemente contarnos tu experiencia. Cada mensaje es leído
              y tomado en cuenta para el desarrollo de Minutas.
            </p>
          </div>
        </div>

        {/* Sent counter badge */}
        {sentCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              {sentCount === 1
                ? 'Has enviado 1 comentario en esta sesión. ¡Gracias!'
                : `Has enviado ${sentCount} comentarios en esta sesión. ¡Gracias por tu ayuda!`}
            </p>
          </div>
        )}

        {/* Type selector */}
        <Card className="shadow-lg border-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tipo de comentario</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {FEEDBACK_TYPES.map(({ value, label, icon: Icon, selected, idle }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-semibold',
                  type === value ? selected : idle
                )}
              >
                <Icon className="h-6 w-6" />
                {label}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Message */}
        <Card className="shadow-lg border-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tu mensaje</CardTitle>
            <CardDescription>
              Describe lo que quieres compartir con el mayor detalle posible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-msg" className="sr-only">Mensaje</Label>
              <Textarea
                id="feedback-msg"
                placeholder={PLACEHOLDERS[type]}
                className="min-h-[150px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
            </div>

            <Button
              className="w-full h-11 gap-2"
              onClick={handleSend}
              disabled={isSending || !message.trim()}
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Enviando...' : 'Enviar comentario'}
            </Button>
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}
