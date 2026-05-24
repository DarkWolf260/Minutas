'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { Clock, GripVertical, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Staff, StaffMember, StaffRole } from '@/lib/types';
import { StaffListEditor } from '@/components/guards/guard-staff-editor';

// Sub-componentes locales
import { ActivityItem } from './activity-item';
import { NoteItem } from './note-item';
import { ResultDialog } from './result-dialog';
import { AddActivityForm } from './add-activity-form';
import { useOrdenDelDia, Nota } from '@/hooks/use-orden-del-dia';

interface OrdenDelDiaFormProps {
  selectedGuard: string;
  periodo: string;
  initialData?: Staff;
  isGuardOpen?: boolean;
}

export interface OrdenDelDiaFormRef {
  generateOrder: () => void;
}

export const OrdenDelDiaForm = forwardRef<OrdenDelDiaFormRef, OrdenDelDiaFormProps>(
  ({ selectedGuard, periodo, initialData, isGuardOpen = false }, ref) => {
    const hook = useOrdenDelDia(selectedGuard, periodo, initialData, isGuardOpen);
    const isMobile = useIsMobile();

    useImperativeHandle(ref, () => ({
      generateOrder: hook.manejarGenerarOrden,
    }));

    return (
      <div className="md:h-full flex flex-col min-h-0">
        <div className="space-y-6 flex-1 md:flex md:flex-col min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-2 md:flex-1 min-h-0">
            <SeccionDistribucionPersonal hook={hook} />
            <SeccionActividadesDia hook={hook} />
            <SeccionNotasAdm hook={hook} />
          </div>
        </div>

        <ResultDialog
          isOpen={hook.esDialogOpenResultado}
          onOpenChange={hook.setEsDialogOpenResultado}
          isMobile={isMobile}
          generatedOrder={hook.ordenGenerada}
          copyButtonText={hook.textoBotonCopiar}
          onCopy={hook.manejarCopiadoAlPortapapeles}
        />
      </div>
    );
  }
);

function SeccionDistribucionPersonal({ hook }: { hook: any }) {
  const { 
    sensores, 
    collisionDetection, 
    manejarDragStart, 
    manejarDragEnd, 
    roles, 
    personalAsignado, 
    manejarUpdatePersonalRol, 
    esJefeEncargado, 
    setEsJefeEncargado,
    idActivoDnd,
    miembroActivoDnd
  } = hook;

  return (
    <Card className="shadow-sm flex flex-col md:flex-1 md:h-full overflow-hidden border-muted/50 min-h-[400px] h-auto">
      <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-primary" />
          Distribución de Personal
        </CardTitle>
      </CardHeader>
      <DndContext 
        sensors={sensores} 
        collisionDetection={collisionDetection} 
        onDragStart={manejarDragStart} 
        onDragEnd={manejarDragEnd}
      >
        <ScrollArea className="flex-1 p-4 pt-4" type="always">
          <div className="grid grid-cols-1 gap-4">
            {roles
              .filter((r: StaffRole) => !r.is_hidden)
              .sort((a: StaffRole, b: StaffRole) => (a.hierarchy_order ?? a.order ?? 0) - (b.hierarchy_order ?? b.order ?? 0))
              .map((role: StaffRole) => (
              <div key={role.name} className="space-y-3">
                <StaffListEditor
                  label={role.name}
                  staffMembers={personalAsignado[role.name] || []}
                  is_single={role.is_single}
                  onUpdate={(members: StaffMember[]) => manejarUpdatePersonalRol(role.name, members)}
                  showObservations={true}
                />
                {role.name.toLowerCase() === 'jefe de los servicios' && (
                  <div className="flex items-center justify-between px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col">
                      <Label htmlFor="jefe-encargado" className="text-[11px] font-bold uppercase tracking-tight text-primary/80">Encargado (E)</Label>
                      <p className="text-[9px] text-muted-foreground font-medium">Marcado como encargado de los servicios</p>
                    </div>
                    <Switch id="jefe-encargado" checked={esJefeEncargado} onCheckedChange={setEsJefeEncargado} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DragOverlay 
          dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}
        >
          {idActivoDnd && miembroActivoDnd ? (
            <div className="flex items-center justify-between p-3 pl-4 bg-background border rounded-lg shadow-xl z-[500] pointer-events-none">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground/90 truncate">
                    {miembroActivoDnd.rank && miembroActivoDnd.rank !== 'Sin jerarquía' && (
                      <span className="mr-1.5">{miembroActivoDnd.rank}</span>
                    )}
                    {miembroActivoDnd.titulo && (
                      <span className="mr-1.5">{miembroActivoDnd.titulo}</span>
                    )}
                    {miembroActivoDnd.name}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-tighter">{miembroActivoDnd.cedula || 'SIN CÉDULA'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Card>
  );
}

function SeccionActividadesDia({ hook }: { hook: any }) {
  const { 
    manejarRestaurarActividades, 
    manejarAñadirActividad, 
    idActividadEditando, 
    actividades, 
    manejarGuardarEdicionActividad, 
    manejarCancelarEdicionActividad, 
    manejarEditActivity, 
    manejarEditarActividad,
    manejarEliminarActividad 
  } = hook;

  return (
    <Card className="shadow-sm flex flex-col md:flex-1 md:h-full overflow-hidden border-muted/50 min-h-[400px] h-auto">
      <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actividades del Día</CardTitle>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-primary hover:bg-primary/10" onClick={manejarRestaurarActividades}>Restaurar</Button>
        </div>
      </CardHeader>
      <AddActivityForm 
        onAdd={manejarAñadirActividad}
        editingActivity={idActividadEditando ? actividades.find((a: any) => a.id === idActividadEditando) || null : null}
        onSaveEdit={manejarGuardarEdicionActividad}
        onCancelEdit={manejarCancelarEdicionActividad}
      />
      <ScrollArea className="flex-1" type="always">
        <div className="p-4 space-y-2">
          {actividades.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <PlusCircle className="h-8 w-8 mb-2 stroke-1" />
              <p className="text-[11px] font-medium uppercase tracking-widest text-center px-4">Sin actividades registradas</p>
            </div>
          ) : (
            actividades.map((actividad: any) => (
              <ActivityItem
                key={actividad.id}
                activity={actividad}
                isEditing={idActividadEditando === actividad.id}
                onEdit={manejarEditarActividad}
                onRemove={manejarEliminarActividad}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

function SeccionNotasAdm({ hook }: { hook: any }) {
  const { 
    manejarRestaurarNotas, 
    manejarAñadirNota, 
    notas, 
    manejarUpdateNota, 
    manejarEliminarNota 
  } = hook;

  return (
    <Card className="shadow-sm flex flex-col md:flex-1 md:h-full overflow-hidden border-muted/50 min-h-[400px] h-auto">
      <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notas Adm.</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={manejarRestaurarNotas}>Restaurar</Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={manejarAñadirNota}>+ Añadir</Button>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="pt-4 flex-1" type="always">
        <div className="space-y-3 px-4">
          {notas.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg bg-muted/5">No hay notas registradas.</p>
          ) : (
            notas.map((nota: Nota) => (
              <NoteItem key={nota.id} note={nota} onUpdate={manejarUpdateNota} onRemove={manejarEliminarNota} />
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

