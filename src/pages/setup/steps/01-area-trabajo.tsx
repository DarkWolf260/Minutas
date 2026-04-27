import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SetupStepLayout } from './layout';

export function PasoAreaTrabajo({
  workspacesExistentes,
  alSiguiente,
  alAtras,
}: {
  workspacesExistentes: string[];
  alSiguiente: (nombre: string, esExistente: boolean) => void;
  alAtras: () => void;
}) {
  const [modo, setModo] = useState<'new' | 'existing'>(
    workspacesExistentes.length > 0 ? 'existing' : 'new'
  );
  const [nombre, setNombre] = useState('');
  const [seleccionado, setSeleccionado] = useState(workspacesExistentes[0] ?? '');

  const manejarContinuar = () => {
    if (modo === 'new' && nombre.trim()) alSiguiente(nombre.trim(), false);
    if (modo === 'existing' && seleccionado) alSiguiente(seleccionado, true);
  };

  const puedeContinuar = modo === 'new' ? !!nombre.trim() : !!seleccionado;

  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={manejarContinuar}
      deshabilitado={!puedeContinuar}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Layers className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Área de Trabajo</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Organiza tus reportes, plantillas y personal por área. Puedes crear varias (ej. por puesto o turno).
          </p>
        </div>

        {workspacesExistentes.length > 0 && (
          <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
            {(['existing', 'new'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={cn(
                  'flex-1 text-sm py-1.5 rounded-md transition-all font-medium',
                  modo === m ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                )}
              >
                {m === 'existing' ? 'Usar existente' : 'Crear nueva'}
              </button>
            ))}
          </div>
        )}

        {modo === 'new' ? (
          <div className="space-y-2">
            <Label htmlFor="ws-name" className="text-sm font-medium">Nombre del área</Label>
            <Input
              id="ws-name"
              placeholder='Ej. "Puesto Norte", "Guardia Nocturna"'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && puedeContinuar && manejarContinuar()}
              autoFocus
              className="h-11"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Seleccionar área de trabajo</Label>
            <Select value={seleccionado} onValueChange={setSeleccionado}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Elige un área..." /></SelectTrigger>
              <SelectContent className="z-[200]">
                {workspacesExistentes.map((ws) => (
                  <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </SetupStepLayout>
  );
}
