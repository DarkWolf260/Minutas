'use client';

import React, { useMemo } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StaffRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, Layers, ArrowUpDown, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSorterProps {
  roles: StaffRole[];
  onReorder: (roles: StaffRole[]) => void;
  onSave?: () => void;
}

function SortableRoleItem({ role }: { role: StaffRole }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: role.name });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all active:scale-[0.98] active:shadow-lg",
        isDragging ? "opacity-30 border-primary/50 shadow-2xl z-50" : "hover:border-primary/30 hover:shadow-sm"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none truncate">{role.name}</p>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
           {role.departmentScope && role.departmentScope.length > 0 ? "Asignado" : "Global"}
        </p>
      </div>

      {role.isStatus && (
        <Badge variant="outline" className={cn(
          "text-[9px] h-4 font-bold uppercase tracking-widest",
          role.name.toLowerCase() === 'apoyo' 
            ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" 
            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
        )}>
          {role.name.toLowerCase() === 'apoyo' ? 'Item Especial' : 'Estatus'}
        </Badge>
      )}

      {role.isSingle && (
        <Badge variant="outline" className="text-[9px] h-4 bg-primary/5 text-primary border-primary/20">
          Único
        </Badge>
      )}
    </div>
  );
}

export function RoleSorter({ roles, onReorder, onSave }: RoleSorterProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [roles]);

  const activeRole = useMemo(() => {
     return activeId ? roles.find(r => r.name === activeId) : null;
  }, [activeId, roles]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedRoles.findIndex((item) => item.name === active.id);
      const newIndex = sortedRoles.findIndex((item) => item.name === over.id);

      const reordered = arrayMove(sortedRoles, oldIndex, newIndex);
      
      // Update the 'order' property for all roles based on their new position
      const updatedRoles = reordered.map((role, index) => ({
        ...role,
        order: index
      }));

      onReorder(updatedRoles);
    }
  }

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  return (
    <Card className="md:flex-1 border-muted/50 bg-muted/5 shadow-inner md:overflow-hidden md:flex md:flex-col md:min-h-0">
      <CardHeader className="pb-3 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ArrowUpDown className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Jerarquía de Reporte</CardTitle>
              <CardDescription className="text-[11px] mt-0.5">Define el orden en el reporte.</CardDescription>
            </div>
          </div>
          
          {onSave && (
            <Button 
                onClick={onSave} 
                size="sm"
                className="shadow-md bg-primary hover:bg-primary/90 font-bold h-8 text-[11px] px-4 transition-all active:scale-95 shrink-0"
            >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Guardar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:flex-1 md:min-h-0 md:overflow-hidden">
        <ScrollArea className="md:h-full pr-4 -mr-4" type="always">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={sortedRoles.map(r => r.name)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 pb-4">
                {sortedRoles.map((role) => (
                  <SortableRoleItem key={role.name} role={role} />
                ))}
                
                {sortedRoles.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto opacity-20 mb-2" />
                    <p className="text-xs">No hay cargos definidos</p>
                  </div>
                )}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.4',
                    },
                  },
                }),
              }}>
              {activeRole ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card shadow-2xl scale-105 z-[100] border-primary pointer-events-none">
                      <GripVertical className="h-4 w-4 text-primary" />
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{activeRole.name}</p>
                      </div>
                  </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
